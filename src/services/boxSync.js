import { db } from "../db";
import { supabase, hasSupabaseCredentials } from "../lib/supabaseClient";
import { getIdentity } from "../lib/authHelper";
import { withStepTimeout } from "./syncDebug";
import { restSelect, restUpsert } from "./supabaseRest";

const getOwnerId = async (explicitUserId = null) => {
  if (explicitUserId) return explicitUserId;
  const { owner_id, success } = await getIdentity();
  return success ? owner_id : null;
};

const ensureLocalBoxMetadata = async (cajasLocales) => {
  const now = new Date().toISOString();

  for (const caja of cajasLocales) {
    const patch = {};

    if (!caja.remote_id) {
      patch.remote_id = crypto.randomUUID();
    }
    if (!caja.updated_at) {
      patch.updated_at = now;
    }

    if (Object.keys(patch).length > 0) {
      patch.synced = 0; // Marcar para sincronizar si hubo cambios en metadata básica
      await db.cajas.update(caja.id, patch);
      Object.assign(caja, patch);
    }
  }
};

export const pushBoxesToRemote = async (ownerUserId = null) => {
  try {
    console.log("[BoxSync] Iniciando pushBoxesToRemote...");

    if (!hasSupabaseCredentials) {
      console.warn("[BoxSync] Sin credenciales Supabase. Push omitido.");
      return { success: true, pushed: 0 };
    }

    const owner_user_id = await getOwnerId(ownerUserId);
    if (!owner_user_id) {
      console.warn("[BoxSync] No hay sesión activa. Push abortado.");
      return { success: true, pushed: 0 };
    }

    const cajasLocales = await withStepTimeout("[BoxSync] db.cajas.where({synced:0}).toArray", () => 
      db.cajas.where("synced").equals(0).toArray()
    );
    
    if (!cajasLocales.length) {
      console.log("[BoxSync] No hay cajas pendientes (synced:0).");
      return { success: true, pushed: 0 };
    }

    await ensureLocalBoxMetadata(cajasLocales);

    const records = cajasLocales.map((caja) => ({
      id: caja.remote_id,
      local_id: caja.id,
      owner_user_id,
      fecha_clave: caja.fechaClave,
      abierta: Boolean(caja.abierta),
      cerrada: Boolean(caja.cerrada),
      fecha_apertura: caja.fechaApertura || null,
      fecha_cierre: caja.fechaCierre || null,
      monto_apertura: Number(caja.montoApertura || 0),
      monto_cierre_real: caja.montoCierreReal === null || caja.montoCierreReal === undefined ? null : Number(caja.montoCierreReal),
      diferencia_cierre: caja.diferenciaCierre === null || caja.diferenciaCierre === undefined ? null : Number(caja.diferenciaCierre),
      efectivo_esperado: caja.efectivoEsperado === null || caja.efectivoEsperado === undefined ? null : Number(caja.efectivoEsperado),
      ventas_efectivo: caja.ventasEfectivo === null || caja.ventasEfectivo === undefined ? null : Number(caja.ventasEfectivo),
      ventas_otros_medios: caja.ventasOtrosMedios === null || caja.ventasOtrosMedios === undefined ? null : Number(caja.ventasOtrosMedios),
      updated_at: caja.updated_at,
    }));

    const CHUNK_SIZE = 10;
    let totalPushed = 0;
    console.log(`🚀 [Sync-Push] Cajas con synced=0: ${records.length}`);
    console.log("📦 [Sync-Push] Payload de Cajas:", JSON.stringify(records, null, 2));
    console.log(`[BoxSync] Procesando en bloques de ${CHUNK_SIZE}...`);

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const { data, error, status } = await withStepTimeout(
        `[BoxSync] supabase cajas upsert (chunk ${i / CHUNK_SIZE + 1})`,
        () => restUpsert("cajas", chunk, { onConflict: "owner_user_id,fecha_clave" })
      );

      console.log(`📡 [Supabase-Response] Cajas (chunk ${i / CHUNK_SIZE + 1}) - Data:`, data, "Status:", status);

      if (error) {
        console.error(`[BoxSync] Error en upsert remoto (chunk ${i / CHUNK_SIZE + 1}):`, error);
        return { success: false, error, pushed: totalPushed };
      }

      if (Array.isArray(data) && data.length > 0) {
        await db.transaction("rw", db.cajas, async () => {
          for (const remoto of data) {
            if (typeof remoto.local_id === "number") {
              await db.cajas.update(remoto.local_id, {
                remote_id: remoto.id,
                synced: 1,
                updated_at: remoto.updated_at || new Date().toISOString(),
              });
              console.log("✅ [Local-Update] Caja marcada como sincronizada:", remoto.local_id);
            }
          }
        });
        totalPushed += data.length;
      }
    }

    console.log(`[BoxSync] Éxito Push: ${totalPushed} cajas procesadas.`);
    return { success: true, pushed: totalPushed };
  } catch (error) {
    console.error("[BoxSync] Error crítico en pushBoxesToRemote:", error);
    return { success: false, error };
  }
};

export const pullBoxesFromRemote = async (ownerUserId = null) => {
  try {
    console.log("[BoxSync] Iniciando pullBoxesFromRemote...");

    if (!hasSupabaseCredentials) {
      console.warn("[BoxSync] Sin credenciales Supabase. Pull omitido.");
      return { success: true, pulled: 0 };
    }

    const owner_user_id = await getOwnerId(ownerUserId);
    if (!owner_user_id) {
      console.warn("[BoxSync] No hay sesión activa. Pull abortado.");
      return { success: true, pulled: 0 };
    }

    console.log(`🔍 [Sync-Pull] Trayendo últimos 100 registros (sin filtro temporal)`);
    const { data: remotas, error } = await withStepTimeout(
      "[BoxSync] supabase cajas select",
      () => restSelect("cajas", { 
        select: "*", 
        filters: { 
          owner_user_id,
        },
        extraQuery: { limit: 100, order: "updated_at.desc" }
      })
    );

    if (error) {
      console.error("[BoxSync] Error en select remoto:", error);
      return { success: false, error };
    }

    if (!Array.isArray(remotas) || remotas.length === 0) {
      return { success: true, pulled: 0 };
    }

    let integradas = 0;

    await db.transaction("rw", db.cajas, async () => {
      const cajasLocales = await withStepTimeout("[BoxSync] db.cajas.toArray (pull)", () => db.cajas.toArray());

      for (const remota of remotas) {
        const local = cajasLocales.find((caja) =>
          (caja.remote_id && caja.remote_id === remota.id) ||
          (typeof caja.id === "number" && typeof remota.local_id === "number" && caja.id === remota.local_id) ||
          (caja.fechaClave && remota.fecha_clave && caja.fechaClave === remota.fecha_clave)
        );

        const payload = {
          remote_id: remota.id,
          fechaClave: remota.fecha_clave,
          abierta: Boolean(remota.abierta),
          cerrada: Boolean(remota.cerrada),
          fechaApertura: remota.fecha_apertura || null,
          fechaCierre: remota.fecha_cierre || null,
          montoApertura: Number(remota.monto_apertura || 0),
          montoCierreReal: remota.monto_cierre_real === null ? null : Number(remota.monto_cierre_real),
          diferenciaCierre: remota.diferencia_cierre === null ? null : Number(remota.diferencia_cierre),
          efectivoEsperado: remota.efectivo_esperado === null ? null : Number(remota.efectivo_esperado),
          ventasEfectivo: remota.ventas_efectivo === null ? null : Number(remota.ventas_efectivo),
          ventasOtrosMedios: remota.ventas_otros_medios === null ? null : Number(remota.ventas_otros_medios),
          updated_at: remota.updated_at || new Date().toISOString(),
        };

        if (local) {
          const localDate = local.updated_at ? new Date(local.updated_at).getTime() : 0;
          const remoteDate = remota.updated_at ? new Date(remota.updated_at).getTime() : 1;

          if (remoteDate > localDate) {
            await db.cajas.update(local.id, payload);
            integradas++;
          }
        } else {
          await db.cajas.add(payload);
          integradas++;
        }
      }
    });

    console.log(`[BoxSync] Éxito Pull: ${integradas} cajas integradas.`);
    return { success: true, pulled: integradas };
  } catch (error) {
    console.error("[BoxSync] Error crítico en pullBoxesFromRemote:", error);
    return { success: false, error };
  }
};

export const syncBoxesNow = async (ownerUserId = null, options = {}) => {
  if (!hasSupabaseCredentials) {
    console.warn("[BoxSync] Sin credenciales Supabase. Sync omitido.");
    return { pushed: 0, pulled: 0, success: true };
  }

  try {
    const { skipPull = false, skipPush = false } = options;
    
    const pushRes = skipPush ? { success: true, pushed: 0 } : await pushBoxesToRemote(ownerUserId);
    if (!pushRes.success) return pushRes;
    
    const pullRes = skipPull ? { success: true, pulled: 0 } : await pullBoxesFromRemote(ownerUserId);
    if (!pullRes.success) return pullRes;

    return { 
      pushed: pushRes.pushed, 
      pulled: pullRes.pulled, 
      success: true 
    };
  } catch (error) {
    return { success: false, error: error.message || error };
  }
};
