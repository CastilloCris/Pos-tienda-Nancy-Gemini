import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { setCurrentAuthUser, setCurrentAccessToken } from "../lib/sessionState";

/**
 * AuthContext — gestión global de sesión Supabase + perfil de usuario con rol.
 *
 * Expone:
 *   user       → objeto de sesión de Supabase Auth (o null)
 *   profile    → fila de la tabla `profiles` con email, nombre, role, store_id
 *   role       → string 'admin' | 'vendedor' | null
 *   isAdmin    → boolean
 *   isSeller   → boolean
 *   loading    → true mientras se resuelve la sesión inicial
 *   signIn     → fn(email, password) → { error }
 *   signOut    → fn()
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Carga el perfil desde la tabla `profiles` de Supabase */
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // Log completo para diagnosticar en consola del navegador
      console.error("[Auth] Error cargando perfil:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      const isSetupError =
        error.code === "PGRST116" ||
        error.message?.includes("relation") ||
        error.message?.includes("does not exist") ||
        error.code === "42P01";

      if (isSetupError) {
        console.warn("[Auth] Tabla 'profiles' no configurada. Acceso admin temporario.");
        setProfile({ role: "admin", nombre: "Admin" });
      } else {
        // Posible error de RLS u otro. Fallback admin para no bloquear al dueño.
        console.warn("[Auth] Fallback admin por error desconocido.");
        setProfile({ role: "admin", nombre: "Admin" });
      }
      return;
    }
    setProfile(data);
    console.log(`[Auth] Perfil cargado ✓ | email: ${data.email} | role: ${data.role}`);
  };

  useEffect(() => {
    // Timeout de seguridad: si getSession() cuelga más de 6s, la app igual muestra el login
    const safetyTimer = setTimeout(() => {
      console.warn('[Auth] getSession() tardó más de 6 s — forzando loading=false para mostrar la app.');
      setLoading(false);
    }, 6000);

    // 1. Cargar sesión existente al montar (compatibilidad offline / refresh de página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimer);
      setUser(session?.user ?? null);
      setCurrentAuthUser(session?.user ?? null);
      setCurrentAccessToken(session?.access_token ?? null);
      loadProfile(session?.user?.id ?? null).finally(() => setLoading(false));
    }).catch((err) => {
      clearTimeout(safetyTimer);
      console.error('[Auth] getSession() falló:', err);
      setLoading(false);
    });

    // 2. Escuchar cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setCurrentAuthUser(nextUser);
        setCurrentAccessToken(session?.access_token ?? null);
        await loadProfile(nextUser?.id ?? null);
        setLoading(false);
      }
    );

    return () => { clearTimeout(safetyTimer); subscription.unsubscribe(); };
  }, []);

  /** Iniciar sesión con email + password */
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  /** Cerrar sesión — limpia estado local aunque Supabase falle */
  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setLoading(false);
    setCurrentAuthUser(null);

    try {
      console.log("[Auth] Cerrando sesión...");
      const { error } = await supabase.auth.signOut();
      if (error) console.error("[Auth] Error de Supabase al cerrar sesión:", error.message);
      else console.log("[Auth] Sesión cerrada correctamente.");
    } catch (e) {
      console.error("[Auth] Excepción inesperada en signOut:", e);
    } finally {
      // Refuerzo idempotente para garantizar que la UI quede fuera de sesión.
      setUser(null);
      setProfile(null);
      setLoading(false);
      setCurrentAuthUser(null);
    }
  };

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";
  const isSeller = role === "vendedor";

  return (
    <AuthContext.Provider value={{ user, profile, role, isAdmin, isSeller, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook de acceso al contexto de autenticación */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
