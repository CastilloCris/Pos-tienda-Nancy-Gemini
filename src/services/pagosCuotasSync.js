import { db } from '../db';
import { hasSupabaseCredentials } from '../lib/supabaseClient';
import { getIdentity } from '../lib/authHelper';
import { withStepTimeout } from './syncDebug';
import { restSelect, restUpsert } from './supabaseRest';

/**
 * Sube los pagos de cuotas pendientes (synced=0) a Supabase.
 */
export const pushPagosCuotas = async (ownerUserId = null) => {
  try {
    console.log('[PagosCuotasSync] Iniciando push...');

    if (!hasSupabaseCredentials) {
      console.warn('[PagosCuotasSync] Sin credenciales Supabase. Push omitido.');
      return { success: true, pushed: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) {
      console.warn('[PagosCuotasSync] No hay sesión activa. Push abortado.');
      return { success: true, pushed: 0 };
    }

    const pendientes = await withStepTimeout(
      '[PagosCuotasSync] db.pagos_cuotas.filter(synced=0)',
      () => db.pagos_cuotas.where('synced').equals(0).toArray()
    );

    if (!pendientes.length) {
      console.log('[PagosCuotasSync] No hay pagos pendientes para subir.');
      return { success: true, pushed: 0 };
    }

    // Resolver remote_id del cliente para cada pago
    const clientesLocales = await db.clientes.toArray();

    const records = pendientes.map((p) => {
      const clienteLocal = clientesLocales.find((c) => c.id === p.cliente_id);
      return {
        // Sin campo `id` → Supabase generara UUID automáticamente en primer push.
        // En pushes subsiguientes necesitamos el remote_id guardado localmente.
        ...(p.remote_id ? { id: p.remote_id } : {}),
        local_id: p.id,
        owner_user_id,
        cliente_id: clienteLocal?.remote_id || null,
        local_cliente_id: typeof p.cliente_id === 'number' ? p.cliente_id : null,
        cliente_nombre: p.cliente_nombre || null,
        monto: p.monto,
        metodo_pago: p.metodo_pago,
        fecha: p.fecha,
        fecha_clave: p.fecha_clave,
        caja_id: null,         // UUID remoto de caja (se rellenará cuando sincronicemos cajas)
        local_caja_id: typeof p.caja_id === 'number' ? p.caja_id : null,
        updated_at: p.updated_at || new Date().toISOString(),
      };
    });

    const { data, error } = await withStepTimeout(
      '[PagosCuotasSync] restUpsert pagos_cuotas',
      () => restUpsert('pagos_cuotas', records, { onConflict: 'local_id,owner_user_id', returning: true }),
      20000
    );

    if (error) {
      console.error('[PagosCuotasSync] Error en upsert:', error);
      return { success: false, error };
    }

    // Marcar como sincronizados y guardar remote_id devuelto
    if (Array.isArray(data) && data.length > 0) {
      await db.transaction('rw', db.pagos_cuotas, async () => {
        for (const remoto of data) {
          if (typeof remoto.local_id === 'number') {
            await db.pagos_cuotas.update(remoto.local_id, {
              synced: 1,
              remote_id: remoto.id,
              updated_at: remoto.updated_at || new Date().toISOString(),
            });
          }
        }
      });
    } else {
      // Si Supabase no devuelve data (ej: sin returning), marcar synced=1 igual
      await db.transaction('rw', db.pagos_cuotas, async () => {
        for (const p of pendientes) {
          await db.pagos_cuotas.update(p.id, { synced: 1 });
        }
      });
    }

    console.log(`[PagosCuotasSync] Push OK: ${pendientes.length} pagos subidos.`);
    return { success: true, pushed: pendientes.length };
  } catch (err) {
    console.error('[PagosCuotasSync] Error crítico en push:', err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Descarga los pagos de cuotas remotos e integra los faltantes localmente.
 */
export const pullPagosCuotas = async (ownerUserId = null) => {
  try {
    console.log('[PagosCuotasSync] Iniciando pull...');

    if (!hasSupabaseCredentials) {
      return { success: true, pulled: 0 };
    }

    const { owner_id: owner_user_id, success } = await getIdentity();
    if (!success || !owner_user_id) return { success: true, pulled: 0 };

    const { data: remotos, error } = await withStepTimeout(
      '[PagosCuotasSync] restSelect pagos_cuotas',
      () => restSelect('pagos_cuotas', {
        select: '*',
        filters: { owner_user_id },
        extraQuery: { limit: 500, order: 'updated_at.desc' },
      })
    );

    if (error) throw error;
    if (!Array.isArray(remotos) || remotos.length === 0) {
      console.log('[PagosCuotasSync] Sin pagos remotos para integrar.');
      return { success: true, pulled: 0 };
    }

    const locales = await db.pagos_cuotas.toArray();
    const clientesLocales = await db.clientes.toArray();

    let integrados = 0;

    for (const remoto of remotos) {
      // Buscar por remote_id o local_id
      const local =
        (remoto.id && locales.find((l) => l.remote_id === remoto.id)) ||
        (typeof remoto.local_id === 'number' && locales.find((l) => l.id === remoto.local_id));

      const clienteLocal = clientesLocales.find(
        (c) => (c.remote_id && c.remote_id === remoto.cliente_id) ||
                (typeof c.id === 'number' && c.id === remoto.local_cliente_id)
      );

      const payload = {
        remote_id: remoto.id,
        cliente_id: clienteLocal?.id ?? (typeof remoto.local_cliente_id === 'number' ? remoto.local_cliente_id : null),
        cliente_nombre: remoto.cliente_nombre || clienteLocal?.nombre || '',
        monto: Number(remoto.monto || 0),
        metodo_pago: remoto.metodo_pago || 'Efectivo',
        fecha: remoto.fecha,
        fecha_clave: remoto.fecha_clave || String(remoto.fecha || '').slice(0, 10),
        caja_id: typeof remoto.local_caja_id === 'number' ? remoto.local_caja_id : null,
        synced: 1,
        updated_at: remoto.updated_at || new Date().toISOString(),
      };

      if (!local) {
        await db.pagos_cuotas.add(payload);
        integrados++;
      }
      // Si ya existe localmente no sobreescribimos (datos de caja puede diferir)
    }

    console.log(`[PagosCuotasSync] Pull OK: ${integrados} pagos nuevos integrados.`);
    return { success: true, pulled: integrados };
  } catch (err) {
    console.error('[PagosCuotasSync] Error crítico en pull:', err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Orquestador principal — push luego pull.
 */
export const syncPagosCuotasNow = async (ownerUserId = null) => {
  try {
    const pushRes = await pushPagosCuotas(ownerUserId);
    if (!pushRes.success) return pushRes;

    const pullRes = await pullPagosCuotas(ownerUserId);
    if (!pullRes.success) return pullRes;

    return { success: true, pushed: pushRes.pushed, pulled: pullRes.pulled };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
};
