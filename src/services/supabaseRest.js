/**
 * supabaseRest.js — Operaciones de datos usando fetch nativo (sin SDK de Supabase)
 *
 * Por qué fetch nativo:
 *   El SDK de Supabase JS llama a getSession() internamente antes de cada petición
 *   REST para agregar el header Authorization. Si getSession() cuelga (por lentitud
 *   de red o problemas de refresh de token), TODAS las peticiones de datos quedan
 *   bloqueadas indefinidamente.
 *
 *   Al usar fetch nativo con el token ya almacenado en sessionState, eliminamos
 *   completamente esa dependencia y cada petición tiene su propio timeout de 15 s.
 */

import { getCurrentAccessToken } from '../lib/sessionState';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
).trim();

const FETCH_TIMEOUT_MS = 15_000;

/** Construye los headers necesarios para las peticiones REST de Supabase */
function buildHeaders(extra = {}) {
  const token = getCurrentAccessToken() || SUPABASE_ANON_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

/** fetch con AbortController — aborta la petición después de FETCH_TIMEOUT_MS */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.warn(`⏱ [REST] fetch abortado (${FETCH_TIMEOUT_MS / 1000}s): ${url}`);
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/** Convierte un objeto de filtros a parámetros PostgREST en la URL */
function applyFilters(searchParams, filters) {
  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('.')) {
      // Formato ya listo: "eq.valor", "gte.valor", etc.
      searchParams.set(key, value);
    } else {
      searchParams.set(key, `eq.${value}`);
    }
  });
}

// ─── SELECT ────────────────────────────────────────────────────────────────────
export const restSelect = async (table, { select = '*', filters = {}, extraQuery = {} } = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  applyFilters(url.searchParams, filters);

  if (extraQuery.order) {
    url.searchParams.set('order', extraQuery.order.replace('.', '.'));
  }
  if (extraQuery.limit) {
    url.searchParams.set('limit', String(extraQuery.limit));
  }
  if (extraQuery.offset !== undefined) {
    url.searchParams.set('offset', String(extraQuery.offset));
  }

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: buildHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`[REST] SELECT ${table} falló (${response.status}):`, error);
      return { data: null, error, status: response.status };
    }

    const data = await response.json();
    return { data, error: null, status: response.status };
  } catch (err) {
    console.error(`[REST] SELECT ${table} excepción:`, err.message);
    return { data: null, error: err, status: null };
  }
};

// ─── UPSERT ────────────────────────────────────────────────────────────────────
export const restUpsert = async (table, records, { onConflict = 'id' } = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set('on_conflict', onConflict);

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method: 'POST',
      headers: buildHeaders({
        Prefer: `resolution=merge-duplicates,return=representation`,
      }),
      body: JSON.stringify(records),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`[REST] UPSERT ${table} falló (${response.status}):`, error);
      return { data: null, error, status: response.status };
    }

    const data = await response.json().catch(() => []);
    return { data, error: null, status: response.status };
  } catch (err) {
    console.error(`[REST] UPSERT ${table} excepción:`, err.message);
    return { data: null, error: err, status: null };
  }
};

// ─── INSERT ────────────────────────────────────────────────────────────────────
export const restInsert = async (table, records) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(records),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return { data: null, error, status: response.status };
    }

    const data = await response.json().catch(() => []);
    return { data, error: null, status: response.status };
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const restDelete = async (table, { filters = {} } = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  applyFilters(url.searchParams, filters);

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method: 'DELETE',
      headers: buildHeaders({ Prefer: 'return=representation' }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return { data: null, error, status: response.status };
    }

    const data = await response.json().catch(() => []);
    return { data, error: null, status: response.status };
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};

// ─── RPC ───────────────────────────────────────────────────────────────────────
export const restRpc = async (functionName, params = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return { data: null, error, status: response.status };
    }

    const data = await response.json().catch(() => null);
    return { data, error: null, status: response.status };
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};
