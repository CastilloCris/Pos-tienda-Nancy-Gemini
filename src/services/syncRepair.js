import { db } from "../db";

/**
 * Utility to reset local sync metadata.
 * This is useful when remote data has been manually deleted or is out of sync.
 * 
 * @param {Object} options 
 * @param {boolean} options.resetProducts - If true, resets products metadata.
 * @param {boolean} options.resetClients - If true, resets clients metadata.
 * @param {boolean} options.resetSales - If true, resets sales metadata.
 * @param {boolean} options.resetBoxes - If true, resets boxes metadata.
 * @param {boolean} options.clearRemoteIds - If true, clears remote_id (CAUTION: may cause duplicates if remote records exist).
 */
export const repairSyncMetadata = async ({
  resetProducts = true,
  resetClients = true,
  resetSales = true,
  resetBoxes = true,
  clearRemoteIds = false,
} = {}) => {
  console.log("[SyncRepair] Iniciando reparación de metadatos de sincronización...");

  try {
    await db.transaction("rw", [db.productos, db.clientes, db.ventas, db.cajas, db.syncQueue], async () => {
      
      if (resetProducts) {
        console.log("[SyncRepair] Reseteando productos...");
        const products = await db.productos.toArray();
        for (const p of products) {
          const patch = { updated_at: new Date(0).toISOString(), synced: 0 }; 
          if (clearRemoteIds) patch.remote_id = null;
          await db.productos.update(p.id, patch);
        }
      }

      if (resetClients) {
        console.log("[SyncRepair] Reseteando clientes...");
        const clients = await db.clientes.toArray();
        for (const c of clients) {
          const patch = { updated_at: new Date(0).toISOString(), synced: 0 };
          if (clearRemoteIds) patch.remote_id = null;
          await db.clientes.update(c.id, patch);
        }
      }

      if (resetSales) {
        console.log("[SyncRepair] Reseteando ventas...");
        const sales = await db.ventas.toArray();
        for (const s of sales) {
          const patch = { sync_status: "pending", updated_at: new Date(0).toISOString() };
          if (clearRemoteIds) patch.remote_id = null;
          await db.ventas.update(s.id, patch);
        }
      }

      if (resetBoxes) {
        console.log("[SyncRepair] Reseteando cajas...");
        const boxes = await db.cajas.toArray();
        for (const b of boxes) {
          const patch = { updated_at: new Date(0).toISOString(), synced: 0 };
          if (clearRemoteIds) patch.remote_id = null;
          await db.cajas.update(b.id, patch);
        }
      }

      // Limpiar la cola de sincronización pendiente para evitar re-ejecutar borrados viejos
      // que podrían fallar si los registros ya no existen en la nube.
      console.log("[SyncRepair] Limpiando cola de sincronización...");
      await db.syncQueue.clear();
    });

    console.log("[SyncRepair] Reparación completada con éxito.");
    return { success: true };
  } catch (error) {
    console.error("[SyncRepair] Error durante la reparación:", error);
    return { success: false, error: error.message };
  }
};
