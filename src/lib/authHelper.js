import { supabase } from "./supabaseClient";
import {
  getCurrentAccessToken,
  getCurrentAuthUser,
  setCurrentAccessToken,
  setCurrentAuthUser,
} from "./sessionState";

const TOKEN_REFRESH_LEEWAY_MS = 60_000;

const getJwtExpiryMs = (token) => {
  if (!token || typeof token !== "string") return 0;

  try {
    const [, payload] = token.split(".");
    if (!payload) return 0;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = JSON.parse(atob(padded));

    return typeof decoded.exp === "number" ? decoded.exp * 1000 : 0;
  } catch (error) {
    console.warn("[AuthHelper] No se pudo leer expiración del JWT:", error);
    return 0;
  }
};

const isTokenFresh = (token) => {
  const expiryMs = getJwtExpiryMs(token);
  return Boolean(expiryMs && expiryMs - Date.now() > TOKEN_REFRESH_LEEWAY_MS);
};

/**
 * Asegura que el token guardado en memoria no esté vencido antes de llamar al
 * REST nativo. Solo consulta Supabase cuando el JWT falta, está por vencer o
 * se fuerza por un 401/PGRST303.
 */
export const ensureFreshAccessToken = async ({ force = false } = {}) => {
  const cachedToken = getCurrentAccessToken();
  if (!force && isTokenFresh(cachedToken)) {
    return { token: cachedToken, success: true };
  }

  try {
    const result = force
      ? await supabase.auth.refreshSession()
      : await supabase.auth.getSession();

    const { data, error } = result;
    if (error) {
      console.error("[AuthHelper] Error renovando sesión:", error);
      return { token: cachedToken ?? null, success: false, error };
    }

    const session = data?.session ?? null;
    if (!session?.access_token) {
      console.warn("[AuthHelper] No hay sesión activa para renovar token.");
      setCurrentAuthUser(null);
      setCurrentAccessToken(null);
      return { token: null, success: false };
    }

    setCurrentAuthUser(session.user ?? null);
    setCurrentAccessToken(session.access_token);
    return { token: session.access_token, success: true };
  } catch (err) {
    console.error("[AuthHelper] Excepción renovando token:", err);
    return { token: cachedToken ?? null, success: false, error: err };
  }
};

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
      const { token } = await ensureFreshAccessToken();
      return { owner_id: cachedUser.id, token, success: true };
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
    setCurrentAuthUser(session.user ?? null);
    setCurrentAccessToken(token ?? null);
    console.log('🔑 [AuthHelper] Identidad OK (desde getSession):', { owner_id, hasToken: !!token });

    return { owner_id, token, success: true };
  } catch (err) {
    console.error('[AuthHelper] Excepción inesperada en getIdentity():', err);
    return { owner_id: null, token: null, success: false, error: err };
  }
};
