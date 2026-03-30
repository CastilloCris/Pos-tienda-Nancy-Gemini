import { supabase } from "./supabaseClient";
import { getCurrentAuthUser } from "./sessionState";

/**
 * Helper centralizado para obtener la identidad del usuario.
 *
 * Estrategia (más rápida, sin llamadas extra a Supabase):
 * 1. Lee el usuario del cache en memoria (sessionState) — sin red, instantáneo.
 * 2. Solo si el cache está vacío, llama a supabase.auth.getSession() como fallback.
 *
 * @returns {Promise<{ owner_id: string | null, token: string | null, success: boolean, error?: any }>}
 */
export const getIdentity = async () => {
  try {
    // ── Intento 1: cache en memoria (sin llamada a Supabase) ──────────────────
    const cachedUser = getCurrentAuthUser();
    if (cachedUser?.id) {
      console.log('[AuthHelper] ✅ Identidad desde cache:', cachedUser.id);
      return { owner_id: cachedUser.id, token: null, success: true };
    }

    // ── Intento 2: fallback a getSession() solo si el cache está vacío ────────
    console.log('[AuthHelper] Cache vacío — llamando a supabase.auth.getSession()...');
    const result = await supabase.auth.getSession();
    console.log('[AuthHelper] Respuesta cruda de getSession():', JSON.stringify(result, null, 2));

    const { data: { session }, error } = result;

    if (error) {
      console.error('[AuthHelper] Error en getSession():', error);
      return { owner_id: null, token: null, success: false, error };
    }

    if (!session) {
      console.warn('[AuthHelper] Sin sesión activa (session = null).');
      return { owner_id: null, token: null, success: false };
    }

    const owner_id = session.user.id;
    const token    = session.access_token;
    console.log('🔑 [AuthHelper] Identidad OK (desde getSession):', { owner_id, hasToken: !!token });

    return { owner_id, token, success: true };
  } catch (err) {
    console.error('[AuthHelper] Excepción inesperada en getIdentity():', err);
    return { owner_id: null, token: null, success: false, error: err };
  }
};
