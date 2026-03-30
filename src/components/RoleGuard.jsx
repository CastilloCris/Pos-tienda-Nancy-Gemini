import { useAuth } from "../contexts/AuthContext";

/**
 * RoleGuard — Protege contenido según roles permitidos.
 *
 * Uso:
 *   <RoleGuard allow={["admin"]}>
 *     <ComponenteAdminOnly />
 *   </RoleGuard>
 *
 * Props:
 *   allow    → array de roles permitidos: ["admin"] | ["admin","vendedor"]
 *   fallback → (opcional) elemento a mostrar si no tiene permiso. 
 *              Default: mensaje de acceso denegado.
 *   silent   → (opcional) si true, no muestra nada (null) en lugar del mensaje.
 */
export function RoleGuard({ allow = [], children, fallback, silent = false }) {
  const { role, loading } = useAuth();

  // Mientras la sesión no termina de cargar, no mostrar nada
  if (loading) return null;

  // Si el rol está en los permitidos, mostrar el contenido
  if (role && allow.includes(role)) return children;

  // Sin permiso: mostrar el fallback o el mensaje predeterminado
  if (silent) return null;
  if (fallback) return fallback;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 max-w-sm">
        <p className="text-4xl mb-4">🔒</p>
        <h3 className="text-lg font-bold text-slate-200 mb-2">Acceso restringido</h3>
        <p className="text-sm text-slate-400">
          Tu rol de <span className="font-semibold text-slate-300">{role || "invitado"}</span> no tiene
          permiso para ver esta sección. Contactá al administrador si necesitás acceso.
        </p>
      </div>
    </div>
  );
}
