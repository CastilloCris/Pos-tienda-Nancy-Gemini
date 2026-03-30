import { Banknote, Cloud, CloudAlert, CloudCog, CloudOff, LogOut, ShieldCheck, User } from "lucide-react";
import Tabs from "./Tabs";
import { useAuth } from "../contexts/AuthContext";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/**
 * Header — barra superior del POS.
 * Ahora muestra el usuario logueado, su rol y botón de cierre de sesión.
 */
function Header({ tabActiva, onTabChange, onLogout, syncStatus, cantidadProductos, ventasRegistradas, carritoCantidad, clientesConDeuda, cajaAbierta, cajaTotalEfectivo }) {
  const { profile, isAdmin, signOut } = useAuth();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    signOut();
  };

  const buildSyncBadge = () => {
    if (!navigator.onLine) {
      return {
        icon: CloudOff,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        label: "Sin conexión",
        title: "No hay conexión a internet. La sincronización queda en espera.",
      };
    }

    switch (syncStatus?.state) {
      case "sincronizando":
        return {
          icon: CloudCog,
          className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
          label: "Sincronizando",
          title: "La aplicación está enviando datos a Supabase.",
        };
      case "sincronizado":
        return {
          icon: Cloud,
          className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
          label: syncStatus?.lastSuccessAt ? `Sync ${new Date(syncStatus.lastSuccessAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : "Sincronizado",
          title: "Datos sincronizados correctamente con Supabase.",
        };
      case "error":
        return {
          icon: CloudAlert,
          className: "border-rose-500/30 bg-rose-500/10 text-rose-200",
          label: "Error sync",
          title: syncStatus?.errorMessage || "Hubo un error al sincronizar con Supabase.",
        };
      default:
        return {
          icon: Cloud,
          className: "border-slate-700 bg-slate-900/80 text-slate-300",
          label: "Sync pendiente",
          title: "Hay cambios pendientes o la sincronización aún no corrió.",
        };
    }
  };

  const syncBadge = buildSyncBadge();
  const SyncIcon = syncBadge.icon;

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-400">Dark POS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-50">Tienda Nancy</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Punto de venta, inventario visual, clientes y cuenta corriente en una sola app local.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inventario</p><p className="mt-2 text-2xl font-bold text-slate-100">{cantidadProductos}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ventas</p><p className="mt-2 text-2xl font-bold text-slate-100">{ventasRegistradas}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ticket</p><p className="mt-2 text-2xl font-bold text-emerald-400">{carritoCantidad}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Con deuda</p><p className="mt-2 text-2xl font-bold text-amber-300">{clientesConDeuda}</p></div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs active={tabActiva} onChange={onTabChange} disableSales={!cajaAbierta} isAdmin={isAdmin} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Estado de caja */}
            <div className={`inline-flex items-center gap-2 self-start rounded-2xl border px-4 py-3 text-sm font-semibold ${cajaAbierta ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
              <Banknote size={16} />
              {cajaAbierta ? `Caja abierta · ${currency.format(cajaTotalEfectivo)}` : "Caja pendiente"}
            </div>

            <div title={syncBadge.title} className={`inline-flex items-center gap-2 self-start rounded-2xl border px-4 py-3 text-sm font-semibold ${syncBadge.className}`}>
              <SyncIcon size={16} className={syncStatus?.state === "sincronizando" ? "animate-spin" : ""} />
              {syncBadge.label}
            </div>

            {/* Info de usuario */}
            {profile && (
              <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm">
                {isAdmin
                  ? <ShieldCheck size={15} className="text-indigo-400 shrink-0" />
                  : <User size={15} className="text-slate-400 shrink-0" />
                }
                <span className="text-slate-300 font-medium">{profile.nombre || profile.email}</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${isAdmin ? "text-indigo-400" : "text-slate-500"}`}>
                  {isAdmin ? "Admin" : "Vendedor"}
                </span>
              </div>
            )}

            {/* Cerrar sesión */}
            <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-200">
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
