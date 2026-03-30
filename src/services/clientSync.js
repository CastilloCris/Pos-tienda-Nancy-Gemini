import { db } from '../db';
import { supabase, hasSupabaseCredentials } from '../lib/supabaseClient';
import { getIdentity } from '../lib/authHelper';
import { withStepTimeout } from './syncDebug';
import { restDelete, restSelect, restUpsert } from './supabaseRest';

const flushDeletedClients = async (owner_user_id) => {
  const pendingDeletes = await db.syncQueue
    .where("entidad")
    .equals("clientes")
    .filter((item) => item.accion === "delete" && !item.synced)
    .toArray();

  for (const item of pendingDeletes) {
    const localId = Number(item?.payload?.id);
    if (!Number.isFinite(localId)) {
      await db.syncQueue.update(item.id, { synced: 1 });
      continue;
    }

    const { error } = await restDelete("clientes", {
      filters: {
        owner_user_id,
        local_id: localId,
      },
    });

    if (error) {
      throw error;
    }

    await db.syncQueue.update(item.id, { synced: 1 });
  }
};

/**
 * Sincroniza (pushea) clientes locales (Dexie) hacia la nube (Supabase).
 * Usa la combinación [owner_user_id, telefono] para hacer upsert si el ID no matchea el UUID remoto.
 * Pero mantendremos el LWW usando el `updated_at`.
 */
export const pushLocalClientsToRemote = async (ownerUserId = null) => {
  try {
    console.log("[ClientSync] Iniciando pushLocalClientsToRemote...");

    if (!hasSupabaseCredentials) {
      console.warn("[ClientSync] Sin credenciales Supabase. Push omitido.");
      return { success: true, pushed: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) {
      console.warn("[ClientSync] No hay sesión activa o fallo auth. Push abortado.");
      return { success: true, pushed: 0 };
    }

    // Leemos local: Solo los pendientes (synced=0)
    const clientesLocales = await withStepTimeout(
      "[ClientSync] db.clientes.filter(synced=0)", 
      () => db.clientes.filter(c => !c.synced).toArray()
    );

    if (!clientesLocales.length) {
      console.log("[ClientSync] No hay clientes pendientes para sincronizar (push).");
      await flushDeletedClients(owner_user_id);
      return { success: true, pushed: 0 };
    }

    // Garantizamos que todos tengan un UUID antes de enviarlos
    for (const c of clientesLocales) {
      if (!c.remote_id) {
        c.remote_id = crypto.randomUUID();
        await db.clientes.update(c.id, { remote_id: c.remote_id });
      }
    }

    const seenPhones = new Set();
    const records = clientesLocales.map((c) => {
      let telefonoLimpio = c.telefono ? String(c.telefono).trim() : null;
      if (telefonoLimpio === "") telefonoLimpio = null;

      if (telefonoLimpio && seenPhones.has(telefonoLimpio)) {
        telefonoLimpio = null; 
      } else if (telefonoLimpio) {
        seenPhones.add(telefonoLimpio);
      }

      return {
        id: c.remote_id,
        local_id: c.id, 
        owner_user_id,
        nombre: c.nombre,
        telefono: telefonoLimpio,
        dni: c.dni || null,
        deuda: c.deuda || 0,
        updated_at: c.updated_at || new Date().toISOString(),
      };
    }).filter(c => c.nombre);

    if (records.length === 0) {
      console.log("[ClientSync] No hay registros válidos para upsert. Solo se procesarán deletes.");
      await flushDeletedClients(owner_user_id);
      return { success: true, pushed: 0 };
    }

    console.log(`🚀 [Sync-Push] Clientes con synced=0: ${records.length}`);
    console.log("📦 [Sync-Push] Payload de Clientes:", JSON.stringify(records, null, 2));

    const CHUNK_SIZE = 50;
    let totalPushed = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const { data, error, status } = await withStepTimeout(
        `[ClientSync] supabase clientes upsert (chunk ${i / CHUNK_SIZE + 1})`,
        () => restUpsert("clientes", chunk, { onConflict: "id", returning: true })
      );

      console.log(`📡 [Supabase-Response] Clientes (chunk ${i / CHUNK_SIZE + 1}) - Data:`, data, "Status:", status);

      if (error) {
        console.error(`[ClientSync] Error en upsert remoto (chunk ${i / CHUNK_SIZE + 1}):`, error);
        return { success: false, error, pushed: totalPushed };
      }

      if (Array.isArray(data) && data.length > 0) {
        await db.transaction("rw", db.clientes, async () => {
          for (const remoto of data) {
            if (typeof remoto.local_id === "number") {
              await db.clientes.update(remoto.local_id, {
                remote_id: remoto.id,
                synced: 1,
                updated_at: remoto.updated_at
              });
              console.log("✅ [Local-Update] Cliente marcado como sincronizado:", remoto.local_id);
            }
          }
        });
        totalPushed += data.length;
      }
    }

    await flushDeletedClients(owner_user_id);
    return { success: true, pushed: totalPushed };
  } catch (err) {
    console.error("[ClientSync] Error crítico en pushLocalClientsToRemote:", err);
    return { success: false, error: err };
  }
};

export const pullClientsFromRemote = async (ownerUserId = null) => {
    try {
        console.log("[ClientSync] Iniciando pullClientsFromRemote...");

        if (!hasSupabaseCredentials) {
          console.warn("[ClientSync] Sin credenciales Supabase. Pull omitido.");
          return { success: true, pulled: 0 };
        }

        const { owner_id: owner_user_id, success } = await getIdentity();
        if (!success || !owner_user_id) return { success: true, pulled: 0 };

        let allRemotos = [];
        let offset = 0;
        const limit = 1000;

        while (true) {
          const { data, error } = await withStepTimeout(
            `[ClientSync] supabase clientes select (offset ${offset})`,
            () => restSelect("clientes", { 
              select: "*", 
              filters: { owner_user_id },
              extraQuery: { limit, offset, order: "updated_at.desc" }
            })
          );
          if (error) throw error;
          if (!data || data.length === 0) break;
          
          allRemotos.push(...data);
          if (data.length < limit) break;
          offset += limit;
        }

        const remotos = allRemotos;

        if (remotos.length === 0) return { success: true, pulled: 0 };

        let integrados = 0;

        await db.transaction('rw', db.clientes, async () => {
            const clientesLocales = await withStepTimeout("[ClientSync] db.clientes.toArray (pull)", () => db.clientes.toArray());

            for (const remoto of remotos) {
                const existeLocal =
                  clientesLocales.find(c => c.remote_id && c.remote_id === remoto.id) ||
                  clientesLocales.find(c => c.dni && remoto.dni && c.dni === remoto.dni) ||
                  clientesLocales.find(c => c.telefono && remoto.telefono && c.telefono === remoto.telefono);

                if (existeLocal) {
                    const localDate = existeLocal.updated_at ? new Date(existeLocal.updated_at).getTime() : 0;
                    const remoteDate = remoto.updated_at ? new Date(remoto.updated_at).getTime() : 1;

                    if (!existeLocal.remote_id || existeLocal.remote_id !== remoto.id) {
                        await db.clientes.update(existeLocal.id, { remote_id: remoto.id });
                    }

                    if (remoteDate > localDate) {
                        await db.clientes.update(existeLocal.id, {
                            remote_id: remoto.id,
                            nombre: remoto.nombre,
                            telefono: remoto.telefono?.startsWith(`TEMP-`) ? "" : (remoto.telefono || ""),
                            dni: remoto.dni || "",
                            deuda: Number(remoto.deuda),
                            updated_at: remoto.updated_at,
                            synced: 1
                        });
                        integrados++;
                    }
                } else {
                    await db.clientes.add({
                        remote_id: remoto.id,
                        nombre: remoto.nombre,
                        telefono: remoto.telefono?.startsWith('TEMP-') ? "" : (remoto.telefono || ""),
                        dni: remoto.dni || "",
                        deuda: Number(remoto.deuda),
                        updated_at: remoto.updated_at,
                        synced: 1
                    });
                    integrados++;
                }
            }
        });

        console.log(`[ClientSync] Éxito Pull: ${integrados} clientes actualizados en Dexie.`);
        return { success: true, pulled: integrados };
    } catch (err) {
        console.error("[ClientSync] Error crítico en pullClientsFromRemote:", err);
        return { success: false, error: err };
    }
}

export const syncClientsNow = async (ownerUserId = null, options = {}) => {
    if (!hasSupabaseCredentials) {
      return { pushed: 0, pulled: 0, success: true };
    }
    try {
        const { skipPull = false, skipPush = false } = options;
        
        const pullRes = skipPull ? { success: true, pulled: 0 } : await pullClientsFromRemote(ownerUserId);
        if (!pullRes.success) return pullRes;
        
        const pushRes = skipPush ? { success: true, pushed: 0 } : await pushLocalClientsToRemote(ownerUserId);
        if (!pushRes.success) return pushRes;

        return { 
            pushed: pushRes.pushed, 
            pulled: pullRes.pulled, 
            success: true 
        };
    } catch (error) {
        return { success: false, error: error.message || error };
    }
};
