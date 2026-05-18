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
import { ensureFreshAccessToken } from '../lib/authHelper';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
).trim();

const FETCH_TIMEOUT_MS = 15_000;

/** Construye los headers necesarios para las peticiones REST de Supabase */
async function buildHeaders(extra = {}, { forceRefresh = false } = {}) {
  await ensureFreshAccessToken({ force: forceRefresh });
  const token = getCurrentAccessToken() || SUPABASE_ANON_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

const isExpiredJwtResponse = (response, error) => (
  response.status === 401 &&
  (error?.code === 'PGRST303' || String(error?.message ?? '').toLowerCase().includes('jwt expired'))
);

async function fetchRestJson(url, requestOptions, { table, operation, parseData = true } = {}) {
  const response = await fetchWithTimeout(url, {
    ...requestOptions,
    headers: await buildHeaders(requestOptions.headers),
  });

  if (response.ok) {
    const data = parseData ? await response.json().catch(() => null) : null;
    return { data, error: null, status: response.status };
  }

  const error = await response.json().catch(() => ({ message: response.statusText }));

  if (isExpiredJwtResponse(response, error)) {
    console.warn(`[REST] ${operation} ${table} recibió JWT vencido. Renovando token y reintentando...`);
    const retry = await fetchWithTimeout(url, {
      ...requestOptions,
      headers: await buildHeaders(requestOptions.headers, { forceRefresh: true }),
    });

    if (retry.ok) {
      const data = parseData ? await retry.json().catch(() => null) : null;
      return { data, error: null, status: retry.status };
    }

    const retryError = await retry.json().catch(() => ({ message: retry.statusText }));
    console.error(`[REST] ${operation} ${table} falló tras renovar token (${retry.status}):`, retryError);
    return { data: null, error: retryError, status: retry.status };
  }

  console.error(`[REST] ${operation} ${table} falló (${response.status}):`, error);
  return { data: null, error, status: response.status };
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
    return await fetchRestJson(url.toString(), {
      method: 'GET',
    }, { table, operation: 'SELECT' });
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
    const result = await fetchRestJson(url.toString(), {
      method: 'POST',
      headers: {
        Prefer: `resolution=merge-duplicates,return=representation`,
      },
      body: JSON.stringify(records),
    }, { table, operation: 'UPSERT' });

    return {
      ...result,
      data: result.data ?? (result.error ? null : []),
    };
  } catch (err) {
    console.error(`[REST] UPSERT ${table} excepción:`, err.message);
    return { data: null, error: err, status: null };
  }
};

// ─── INSERT ────────────────────────────────────────────────────────────────────
export const restInsert = async (table, records) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  try {
    const result = await fetchRestJson(url, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(records),
    }, { table, operation: 'INSERT' });

    return {
      ...result,
      data: result.data ?? (result.error ? null : []),
    };
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const restDelete = async (table, { filters = {} } = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  applyFilters(url.searchParams, filters);

  try {
    const result = await fetchRestJson(url.toString(), {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    }, { table, operation: 'DELETE' });

    return {
      ...result,
      data: result.data ?? (result.error ? null : []),
    };
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};

// ─── RPC ───────────────────────────────────────────────────────────────────────
export const restRpc = async (functionName, params = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

  try {
    return await fetchRestJson(url, {
      method: 'POST',
      body: JSON.stringify(params),
    }, { table: functionName, operation: 'RPC' });
  } catch (err) {
    return { data: null, error: err, status: null };
  }
};
