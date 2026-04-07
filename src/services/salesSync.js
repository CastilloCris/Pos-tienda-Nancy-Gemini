import { db } from '../db';
import { supabase, hasSupabaseCredentials } from '../lib/supabaseClient';
import { pushLocalClientsToRemote } from './clientSync';
import { pushProducts } from './productSync';
import { getIdentity } from '../lib/authHelper';
import { withStepTimeout } from './syncDebug';
import { restRpc, restSelect, restUpsert } from './supabaseRest';

/**
 * Filtra las ventas offline que todavía no subieron y las inserta en Supabase.
 * Previene duplicación gracias al `remote_id` subido a Postgres que tiene política unique `id`.
 */
export const pushPendingSalesToRemote = async (ownerUserId = null, force = false, options = {}) => {
  try {
    console.log(`[SalesSync] Iniciando pushPendingSalesToRemote (force=${force})...`);
    const { skipDependencies = false } = options;

    if (!hasSupabaseCredentials) {
      console.warn("[SalesSync] Sin credenciales Supabase. Push omitido.");
      return { success: true, pushed: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) {
      console.warn("[SalesSync] No hay sesión activa. Push abortado.");
      return { success: true, pushed: 0 };
    }

    // Asegura que las relaciones locales tengan UUID remoto antes de subir ventas.
    if (!skipDependencies) {
      try {
        await pushLocalClientsToRemote(owner_user_id);
      } catch (error) {
        console.warn("[SalesSync] No se pudo sincronizar clientes antes de ventas. Se continuará con cliente_id nulo si hace falta.", error);
      }

      try {
        await pushProducts(owner_user_id);
      } catch (error) {
        console.warn("[SalesSync] No se pudo sincronizar productos antes de ventas. Se continuará con producto_id nulo si hace falta.", error);
      }
    }

    // Buscar ventas que necesiten subir (las que no dicen 'synced', o todas si es force)
    const query = force 
      ? db.ventas 
      : db.ventas.where("synced").equals(0);

    const ventasLocalesPendientes = await withStepTimeout("[SalesSync] db.ventas.toArray (push)", () => query.toArray());

    if (!ventasLocalesPendientes.length) {
      console.log("[SalesSync] No hay ventas pendientes para subir.");
      return { success: true, pushed: 0 };
    }

    // 🔍 Preview diagnóstico de los primeros 2 registros ANTES de enviar
    const preview = ventasLocalesPendientes.slice(0, 2);
    console.log(`🔍 [SalesSync-DEBUG] Primeros ${preview.length} registros a enviar:`);
    preview.forEach((v, i) => {
      console.log(`  [${i}] id=${v.id} remote_id=${v.remote_id} fecha=${v.fecha} clienteId=${v.clienteId}`);
      console.log(`      JSON:`, JSON.stringify(v, null, 2));
    });

    let insertadas = 0;

    // Procesamos secuencialmente por si alguna falla de red tira solo una
    for (const venta of ventasLocalesPendientes) {
      // 1. Validar requerimiento de ID
      if (!venta.remote_id) {
         venta.remote_id = crypto.randomUUID();
         await db.ventas.update(venta.id, { remote_id: venta.remote_id });
      }

      // 2. Extraer Remote ID del cliente si estuviera vinculado a uno y existiera localmente
      let cliente_remote_uuid = null;
      if (venta.clienteId) {
         const cli = await db.clientes.get(venta.clienteId);
         if (cli && cli.remote_id) {
            cliente_remote_uuid = cli.remote_id;
         }
      }

      // 3. Preparar payload principal de la VENTA (Matching exact PostgreSQL definition)
      const ventaPayload = {
        id: venta.remote_id,
        local_id: venta.id || null,
        owner_user_id,
        caja_id: null,
        local_caja_id: venta.cajaId || null,
        cliente_id: cliente_remote_uuid || null,
        local_cliente_id: typeof venta.clienteId === 'number' ? venta.clienteId : null,
        fecha: venta.fecha,
        fecha_clave: venta.fechaClave || venta.fecha.slice(0, 10),
        subtotal: isNaN(Number(venta.subtotal)) ? 0 : Number(venta.subtotal),
        descuento_aplicado: isNaN(Number(venta.descuentoAplicado)) ? 0 : Number(venta.descuentoAplicado),
        total: isNaN(Number(venta.total)) ? 0 : Number(venta.total),
        metodo_pago: venta.metodoPago || null,
        en_cuenta_corriente: Boolean(venta.enCuentaCorriente),
        cliente_nombre: venta.clienteNombre || null,
        cliente_telefono: venta.clienteTelefono || null,
        updated_at: venta.updated_at || new Date().toISOString(),
      };

      // 4. Preparar array de ITEMS relacionados a esta venta
      // Usaremos un for-of para mapear productos a IDs remotos si existen
      const itemsPayload = [];
      for (const articulo of venta.articulos) {
         let producto_remote_uuid = null;
         if (articulo.productoId) {
            const prod = await db.productos.get(articulo.productoId);
            if (prod?.remote_id) {
               producto_remote_uuid = prod.remote_id;
            }
         }

         itemsPayload.push({
            venta_id: venta.remote_id, 
            owner_user_id,
            producto_id: producto_remote_uuid, 
            local_producto_id: typeof articulo.productoId === 'number' ? articulo.productoId : null,
            codigo: articulo.codigo || null,
            nombre: articulo.nombre || "Genérico",
            categoria: articulo.categoria || null,
            precio: isNaN(Number(articulo.precio)) ? 0 : Number(articulo.precio),
            cantidad: isNaN(Number(articulo.cantidad)) ? 1 : Number(articulo.cantidad),
            talle: articulo.talle || null,
            // foto excluida — peso excesivo (base64) causa timeout en el RPC
         });
      }

      // 5. Ejecutar la inserción transaccional vía RPC
      const rpcPayload = {
        venta: ventaPayload,
        items: itemsPayload
      };

      console.log(`🚀 [Sync-Push] Enviando Venta #${venta.id} (remote_id: ${venta.remote_id}) — ${itemsPayload.length} item(s)`);

      // 5a. Upsert de la venta
      const { data: ventaData, error: ventaError } = await withStepTimeout(
        `[SalesSync] upsert ventas local#${venta.id}`,
        () => restUpsert('ventas', [ventaPayload], { onConflict: 'id' }),
        20000
      );

      if (ventaError) {
        console.error(`[SalesSync] Error upserteando venta #${venta.id}:`, ventaError);
        return { success: false, error: ventaError, phase: `venta_${venta.id}` };
      }
      console.log(`📡 [SalesSync] Venta #${venta.id} guardada en Supabase.`, ventaData);

      // 5b. Upsert de los items (solo si hay items)
      if (itemsPayload.length > 0) {
        const { error: itemsError } = await withStepTimeout(
          `[SalesSync] upsert venta_items local#${venta.id}`,
          () => restUpsert('venta_items', itemsPayload, { onConflict: 'venta_id,local_producto_id' }),
          20000
        );

        if (itemsError) {
          console.warn(`[SalesSync] Items de venta #${venta.id} fallaron (venta ya guardada):`, itemsError);
          // No abortamos — la venta principal ya está en Supabase
        } else {
          console.log(`📡 [SalesSync] ${itemsPayload.length} items de venta #${venta.id} guardados.`);
        }
      }

      // 6. Marcar como sincronizada en Dexie
      await db.ventas.update(venta.id, {
        synced: 1,
        updated_at: new Date().toISOString()
      });
      console.log('✅ [Local-Update] Venta marcada como sincronizada:', venta.id);

      insertadas++;
    }

    console.log(`[SalesSync] Push terminado. Ventas sincronizadas: ${insertadas}/${ventasLocalesPendientes.length}.`);
    return { success: true, pushed: insertadas };
  } catch (err) {
    console.error('[SalesSync] Falla crítica en push:', err);
    return { success: false, error: err };
  }
};

export const pullSalesFromRemote = async (ownerUserId = null) => {
  try {
    console.log("[SalesSync] Iniciando pullSalesFromRemote...");

    if (!hasSupabaseCredentials) {
      console.warn("[SalesSync] Sin credenciales Supabase. Pull omitido.");
      return { success: true, pulled: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) {
      console.warn("[SalesSync] No hay sesión activa. Pull abortado.");
      return { success: true, pulled: 0 };
    }

    // Traer las últimas 200 ventas del owner sin filtro de fecha
    const { data: ventasRemotas, error: ventasError } = await withStepTimeout(
      "[SalesSync] supabase ventas select",
      () => restSelect("ventas", {
        select: "*",
        filters: { owner_user_id },
        extraQuery: { limit: 200, order: "updated_at.desc" }
      })
    );
    if (ventasError) throw ventasError;

    console.log('Ventas crudas recibidas de Supabase:', ventasRemotas?.length ?? 0);

    // Traer todos los items del owner
    const { data: itemsRemotos, error: itemsError } = await withStepTimeout(
      "[SalesSync] supabase venta_items select",
      () => restSelect("venta_items", {
        select: "*",
        filters: { owner_user_id },
        extraQuery: { limit: 1000, order: "created_at.desc" }
      })
    );
    if (itemsError) throw itemsError;

    if (!Array.isArray(ventasRemotas) || ventasRemotas.length === 0) {
      console.log("[SalesSync] No hay ventas remotas para integrar.");
      return { success: true, pulled: 0, updated: 0 };
    }

    // Indexar items por venta_id para lookup O(1)
    const itemsByVentaId = new Map();
    for (const item of itemsRemotos || []) {
      const ventaId = item.venta_id;
      if (!ventaId) continue;
      if (!itemsByVentaId.has(ventaId)) {
        itemsByVentaId.set(ventaId, []);
      }
      itemsByVentaId.get(ventaId).push(item);
    }

    // Cargar referencias locales una sola vez para resolución de IDs
    const [clientesLocales, productosLocales, cajasLocales] = await Promise.all([
      withStepTimeout("[SalesSync] db.clientes.toArray (pull)", () => db.clientes.toArray()),
      withStepTimeout("[SalesSync] db.productos.toArray (pull)", () => db.productos.toArray()),
      withStepTimeout("[SalesSync] db.cajas.toArray (pull)", () => db.cajas.toArray()),
    ]);

    let insertadas = 0;
    let actualizadas = 0;

    // Reconciliación directa: por cada venta remota, buscar por remote_id en Dexie
    for (const remota of ventasRemotas) {
      const clienteLocal = clientesLocales.find((c) =>
        (c.remote_id && c.remote_id === remota.cliente_id) ||
        (typeof c.id === "number" && typeof remota.local_cliente_id === "number" && c.id === remota.local_cliente_id)
      );

      const cajaLocal = cajasLocales.find((c) =>
        (c.remote_id && c.remote_id === remota.caja_id) ||
        (typeof c.id === "number" && typeof remota.local_caja_id === "number" && c.id === remota.local_caja_id)
      );

      const articulos = (itemsByVentaId.get(remota.id) || []).map((item) => {
        const productoLocal = productosLocales.find((p) =>
          (p.remote_id && p.remote_id === item.producto_id) ||
          (typeof p.id === "number" && typeof item.local_producto_id === "number" && p.id === item.local_producto_id)
        );
        return {
          productoId: productoLocal?.id ?? (typeof item.local_producto_id === "number" ? item.local_producto_id : null),
          codigo: item.codigo || "",
          nombre: item.nombre || "Genérico",
          categoria: item.categoria || "",
          precio: Number(item.precio || 0),
          cantidad: Number(item.cantidad || 1),
          talle: item.talle || "",
          foto: item.foto || "",
        };
      });

      const payload = {
        remote_id: remota.id,
        fecha: remota.fecha,
        fechaClave: remota.fecha_clave || (remota.fecha ? String(remota.fecha).slice(0, 10) : ""),
        subtotal: Number(remota.subtotal || 0),
        descuentoAplicado: Number(remota.descuento_aplicado || 0),
        montoDescuento: Number(remota.descuento_aplicado || 0),
        total: Number(remota.total || 0),
        metodoPago: remota.metodo_pago || "Efectivo",
        enCuentaCorriente: Boolean(remota.en_cuenta_corriente),
        cajaId: cajaLocal?.id ?? (typeof remota.local_caja_id === "number" ? remota.local_caja_id : null),
        clienteId: clienteLocal?.id ?? (typeof remota.local_cliente_id === "number" ? remota.local_cliente_id : null),
        clienteNombre: remota.cliente_nombre || clienteLocal?.nombre || "",
        clienteTelefono: remota.cliente_telefono || clienteLocal?.telefono || "",
        articulos,
        synced: 1,
        updated_at: remota.updated_at || new Date().toISOString(),
      };

      // Buscar en Dexie estrictamente por remote_id (UUID de Supabase)
      const ventaLocal = await db.ventas.where("remote_id").equals(remota.id).first();

      if (!ventaLocal) {
        // No existe localmente → insertar
        await db.ventas.add(payload);
        insertadas++;
        console.log(`✅ [SalesSync] Venta nueva insertada localmente: ${remota.id}`);
      } else {
        // Existe → actualizar siempre para corregir datos fantasma
        await db.ventas.update(ventaLocal.id, payload);
        actualizadas++;
      }
    }

    console.log(`[SalesSync] Pull completo: ${insertadas} ventas nuevas, ${actualizadas} actualizadas.`);
    return { success: true, pulled: insertadas, updated: actualizadas };
  } catch (err) {
    console.error("[SalesSync] Error en pull:", err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Orquestador principal seguro para invocar desde la UI.
 */
export const syncSalesNow = async (ownerUserId = null, force = false, options = {}) => {
    try {
        const pushRes = await pushPendingSalesToRemote(ownerUserId, force, options);
        if (!pushRes.success) return pushRes;
        
        const pullRes = await pullSalesFromRemote(ownerUserId);
        if (!pullRes.success) return pullRes;

        return { 
          pushed: pushRes.pushed, 
          pulled: pullRes.pulled,
          updated: pullRes.updated ?? 0,
          success: true 
        };
    } catch (error) {
        return { success: false, error: error.message || error };
    }
};
