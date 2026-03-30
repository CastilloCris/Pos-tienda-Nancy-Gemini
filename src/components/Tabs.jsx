import { BarChart3, LayoutDashboard, Package, ShoppingCart, UserRound } from "lucide-react";

/**
 * Tabs — navegación principal del POS.
 *
 * Props:
 *   active       → id del tab activo
 *   onChange     → callback al seleccionar tab
 *   disableSales → bloquea ventas si la caja no está abierta
 *   isAdmin      → si true, muestra todas las tabs; si false, oculta las de admin
 */
function Tabs({ active, onChange, disableSales, isAdmin = false }) {
  // Definición de tabs: [id, label, Icon, soloAdmin]
  const allItems = [
    ["dashboard", "Dashboard", LayoutDashboard, false],    // Todos
    ["ventas",    "Ventas",    ShoppingCart,    false],    // Todos
    ["inventario","Inventario",Package,         false],    // Todos (edición RoleGuard internamente)
    ["clientes",  "Clientes",  UserRound,       false],    // Todos
    ["resumen",   "Resumen",   BarChart3,       false],    // Todos
  ];

  // Filtrar según rol
  const items = allItems.filter(([, , , adminOnly]) => !adminOnly || isAdmin);

  return (
    <div className="inline-flex flex-wrap rounded-2xl border border-slate-800 bg-slate-900/80 p-1">
      {items.map(([id, label, Icon]) => {
        const disabled = disableSales && id === "ventas";
        return (
          <button
            key={id}
            onClick={() => !disabled && onChange(id)}
            disabled={disabled}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active === id ? "bg-indigo-500 text-slate-50 shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"} ${disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-400" : ""}`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
