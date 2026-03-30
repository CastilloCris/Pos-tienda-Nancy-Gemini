import { createClient } from '@supabase/supabase-js';

// ⚠️ Usamos String().trim() para eliminar espacios/newlines invisibles del .env
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
).trim();

export const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseKey);

// 🔗 Log de arranque: permite verificar qué URL/key llega realmente
console.log('🔗 [SupabaseClient] URL cargada :', supabaseUrl  || '⚠️  VITE_SUPABASE_URL vacía');
console.log('🔑 [SupabaseClient] Key presente:', !!supabaseKey);

if (!hasSupabaseCredentials) {
  console.warn('⚠️ [SupabaseClient] Sin credenciales — la sincronización no funcionará.');
}

/**
 * fetch con timeout de 15 s — evita que el SDK de Supabase se cuelgue
 * indefinidamente cuando el endpoint de refresh de token no responde.
 */
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.warn(`⏱ [SupabaseClient] fetch abortado por timeout (15 s): ${url}`);
  }, 15000);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  }
);
