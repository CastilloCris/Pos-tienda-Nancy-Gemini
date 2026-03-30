import { useState } from "react";
import { Banknote, Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * LoginScreen — pantalla de inicio de sesión con email + password.
 * Reemplaza el PinLoginScreen cuando el sistema usa Supabase Auth.
 */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Completá el email y la contraseña.");
      return;
    }

    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);

    if (authError) {
      // Traducir errores comunes de Supabase
      if (authError.message.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Debes confirmar tu email antes de ingresar.");
      } else {
        setError(authError.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-5">
            <Banknote size={30} className="text-indigo-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-400 mb-2">Dark POS</p>
          <h1 className="text-3xl font-black text-slate-50 tracking-tight">Tienda Nancy</h1>
          <p className="text-sm text-slate-400 mt-2">Iniciá sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="tucuenta@ejemplo.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 pl-11 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 pl-11 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                disabled={loading}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600">
          Los usuarios son gestionados por el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
