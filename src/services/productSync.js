import { db } from '../db';
import { supabase, hasSupabaseCredentials } from '../lib/supabaseClient';
import { getIdentity } from '../lib/authHelper';
import { withStepTimeout } from './syncDebug';
import { restDelete, restSelect, restUpsert } from './supabaseRest';

const flushDeletedProducts = async (owner_user_id) => {
  const pendingDeletes = await db.syncQueue
    .where("entidad")
    .equals("productos")
    .filter((item) => item.accion === "delete" && !item.synced)
    .toArray();

  for (const item of pendingDeletes) {
    const localId = Number(item?.payload?.id);
    if (!Number.isFinite(localId)) {
      await db.syncQueue.update(item.id, { synced: 1 });
      continue;
    }

    const { error } = await restDelete("productos", {
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

export const pushProducts = async (ownerUserId = null) => {
  try {
    console.log("[ProductSync] Iniciando pushProducts...");

    if (!hasSupabaseCredentials) {
      console.warn("[ProductSync] Sin credenciales Supabase. Push omitido.");
      return { success: true, pushed: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) {
       console.warn("[ProductSync] Sesión no activa para push.");
       return { success: true, pushed: 0 };
    }

    const productosLocales = await withStepTimeout(
      "[ProductSync] db.productos.filter(synced=0)", 
      () => db.productos.filter(p => !p.synced).toArray()
    );

    if (!productosLocales.length) {
      console.log("[ProductSync] No hay productos pendientes por sincronizar.");
      await flushDeletedProducts(owner_user_id);
      return { success: true, pushed: 0 };
    }

    const now = new Date().toISOString();

    for (const producto of productosLocales) {
      const patch = {};
      if (!producto.remote_id) {
        patch.remote_id = crypto.randomUUID();
      }
      if (!producto.updated_at) {
        patch.updated_at = now;
      }
      if (Object.keys(patch).length > 0) {
        await db.productos.update(producto.id, patch);
        Object.assign(producto, patch);
      }
    }

    const records = productosLocales.map((p) => ({
      id: p.remote_id,
      local_id: p.id,
      owner_user_id,
      codigo: p.codigo || `N/C-${p.id}`,
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      talles: p.talles,
      foto: p.foto,
      detalles: p.detalles,
      stock: Number(p.stock ?? 0),
      stock_minimo: Number(p.stock_minimo ?? 3),
      updated_at: p.updated_at || now,
    }));

    console.log(`🚀 [Sync-Push] Productos con synced=0: ${records.length}`);
    console.log("📦 [Sync-Push] Payload de Productos:", JSON.stringify(records, null, 2));

    const CHUNK_SIZE = 50;
    let totalPushed = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const { data, error, status } = await withStepTimeout(
        `[ProductSync] supabase productos upsert (chunk ${i / CHUNK_SIZE + 1})`,
        () => restUpsert("productos", chunk, { onConflict: "id", returning: true })
      );

      console.log(`📡 [Supabase-Response] Productos (chunk ${i / CHUNK_SIZE + 1}) - Data:`, data, "Status:", status);

      if (error) {
        console.error(`[ProductSync] Upsert failed (chunk ${i / CHUNK_SIZE + 1}):`, error);
        return { success: false, error, pushed: totalPushed };
      }

      if (Array.isArray(data) && data.length > 0) {
        await db.transaction("rw", db.productos, async () => {
          for (const remoto of data) {
            if (typeof remoto.local_id === "number") {
              await db.productos.update(remoto.local_id, {
                remote_id: remoto.id,
                synced: 1,
                updated_at: remoto.updated_at || now,
              });
              console.log("✅ [Local-Update] Producto marcado como sincronizado:", remoto.local_id);
            }
          }
        });
        totalPushed += data.length;
      }
    }

    await flushDeletedProducts(owner_user_id);
    console.log(`[ProductSync] Éxito: ${totalPushed} productos procesados.`);
    return { success: true, pushed: totalPushed };
  } catch (err) {
    console.error("[ProductSync] Error crítico en pushProducts:", err);
    return { success: false, error: err };
  }
};

export const pullProducts = async (ownerUserId = null) => {
  try {
    console.log("[ProductSync] Iniciando pullProducts...");

    if (!hasSupabaseCredentials) {
      console.warn("[ProductSync] Sin credenciales Supabase. Pull omitido.");
      return { success: true, pulled: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) return { success: true, pulled: 0 };

    let allRemotos = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data, error } = await withStepTimeout(
        `[ProductSync] supabase productos select (offset ${offset})`,
        () => restSelect("productos", { 
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

    if (remotos.length === 0) {
      return { success: true, pulled: 0 };
    }

    let integrados = 0;

    await db.transaction("rw", db.productos, async () => {
      const locales = await withStepTimeout("[ProductSync] db.productos.toArray (pull)", () => db.productos.toArray());

      for (const remoto of remotos) {
        const local = locales.find((producto) =>
          (producto.remote_id && producto.remote_id === remoto.id) ||
          (producto.codigo && remoto.codigo && producto.codigo === remoto.codigo)
        );

        const payload = {
          remote_id: remoto.id,
          codigo: remoto.codigo || "",
          nombre: remoto.nombre || "",
          precio: Number(remoto.precio || 0),
          categoria: remoto.categoria || "",
          talles: remoto.talles || "",
          foto: remoto.foto || "",
          detalles: remoto.detalles || "",
          stock: Number(remoto.stock ?? 0),
          stock_minimo: Number(remoto.stock_minimo ?? 3),
          updated_at: remoto.updated_at || new Date().toISOString(),
          synced: 1,
        };

        if (local) {
          const localDate = local.updated_at ? new Date(local.updated_at).getTime() : 0;
          const remoteDate = remoto.updated_at ? new Date(remoto.updated_at).getTime() : 1;

          if (remoteDate > localDate) {
            await db.productos.update(local.id, payload);
            integrados++;
          }
        } else {
          await db.productos.add(payload);
          integrados++;
        }
      }

      // Limpieza espejo: eliminar productos locales que ya no existen en Supabase
      // Solo los que tienen remote_id (ya estuvieron sincronizados alguna vez)
      const remoteIds = new Set(remotos.map((r) => r.id));
      const huerfanos = locales.filter(
        (p) => p.remote_id && !remoteIds.has(p.remote_id)
      );
      for (const huerfano of huerfanos) {
        await db.productos.delete(huerfano.id);
        console.log(`🗑️ [ProductSync] Producto eliminado por mirror cleanup: ${huerfano.nombre} (remote_id=${huerfano.remote_id})`);
      }
    });

    console.log(`[ProductSync] Pull completo: ${integrados} productos integrados.`);
    return { success: true, pulled: integrados };
  } catch (err) {
    console.error("[ProductSync] Error en pull:", err);
    return { success: false, error: err.message || err };
  }
};

export const syncProductsNow = async (ownerUserId = null, options = {}) => {
  if (!hasSupabaseCredentials) {
    return { pushed: 0, pulled: 0, success: true };
  }

  try {
    const { skipPull = false, skipPush = false } = options;
    
    const pullRes = skipPull ? { success: true, pulled: 0 } : await pullProducts(ownerUserId);
    if (!pullRes.success) return pullRes;
    
    const pushRes = skipPush ? { success: true, pushed: 0 } : await pushProducts(ownerUserId);
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
