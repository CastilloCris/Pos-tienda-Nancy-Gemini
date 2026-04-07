import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, AlertCircle, ShoppingCart, Filter } from "lucide-react";
import { 
    getSalesSummary, 
    getLowStockProducts, 
    getCustomersWithDebt, 
    getPendingSyncCount, 
    getTopSellingProducts 
} from "../../utils/metrics";

/**
 * Componente principal del Tab "Dashboard"
 */
export function DashboardSection({ ventas, productos, clientes, pagosCuotas = [], onNavigate }) {
    // Memoizamos los cálculos intensivos para no trabar el render al teclear en otros lados
    const summary = useMemo(() => getSalesSummary(ventas), [ventas]);
    const lowStock = useMemo(() => getLowStockProducts(productos), [productos]);
    const { morosos, cantidad: morososCount, totalDeuda } = useMemo(() => getCustomersWithDebt(clientes), [clientes]);
    const { conteo: pendingSyncs, fallidas: failedSyncs } = useMemo(() => getPendingSyncCount(ventas), [ventas]);
    const topProducts = useMemo(() => getTopSellingProducts(ventas, 5), [ventas]);

    const formatCurrency = (val) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-10">
            {/* --- SECCIÓN 1: DASHBOARD OVERVIEW --- */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="text-indigo-400" /> Vista General (Offline-First)
                </h2>

                {/* Fila de Tarjetas Kpis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Ingresos del Día" 
                        value={formatCurrency(summary.totalHoy + pagosCuotas.filter(p => {
                          const hoy = new Date();
                          const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
                          return new Date(p.fecha).getTime() >= inicio;
                        }).reduce((acc, p) => acc + Number(p.monto || 0), 0))} 
                        subtext={`Ventas: ${formatCurrency(summary.totalHoy)} · ${summary.ventasHoy} tickets`}
                        icon={<ShoppingCart size={20} className="text-indigo-400" />}
                    />
                    <MetricCard 
                        title="Ingresos del Mes" 
                        value={formatCurrency(summary.totalMes + pagosCuotas.filter(p => {
                          const hoy = new Date();
                          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime();
                          return new Date(p.fecha).getTime() >= inicioMes;
                        }).reduce((acc, p) => acc + Number(p.monto || 0), 0))} 
                        subtext={`Ventas: ${formatCurrency(summary.totalMes)} · ${summary.ventasMes} tickets`}
                        icon={<TrendingUp size={20} className="text-emerald-400" />}
                    />
                    <MetricCard 
                        title="Stock Crítico" 
                        value={lowStock.length.toString()} 
                        subtext="Productos por reponer"
                        icon={<AlertCircle size={20} className="text-rose-400" />}
                        intent={lowStock.length > 0 ? "danger" : "normal"}
                        onClick={() => onNavigate?.("inventario", { filter: "bajo-stock" })}
                        className={lowStock.length > 0 ? "cursor-pointer transition-transform hover:scale-[1.02]" : ""}
                    />
                    <MetricCard 
                        title="Deuda de Clientes" 
                        value={formatCurrency(totalDeuda)} 
                        subtext={`${morososCount} clientes en rojo`}
                        icon={<AlertCircle size={20} className="text-amber-400" />}
                        intent={totalDeuda > 0 ? "warning" : "normal"}
                        onClick={() => onNavigate?.("clientes", { filter: "con-deuda" })}
                        className={totalDeuda > 0 ? "cursor-pointer transition-transform hover:scale-[1.02]" : ""}
                    />
                </div>

                {/* Fila inferior dividida en Tablas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    
                    {/* Ranking de Productos */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Top 5 Más Vendidos</h3>
                        {topProducts.length === 0 ? (
                            <div className="text-sm text-slate-500 italic mt-4 text-center">Aún no hay transacciones para analizar.</div>
                        ) : (
                            <div className="space-y-3 flex-1">
                                {topProducts.map((prod, idx) => (
                                    <div key={prod.codigo + idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-200 text-sm line-clamp-1">{prod.nombre}</p>
                                                <p className="text-xs text-slate-400">{prod.cantidad_vendida} unidades vendidas</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-emerald-400 text-sm">
                                            {formatCurrency(prod.ingresos_generados)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Subdivisión lateral para Alertas Pequeñas (Stock y Nube) */}
                    <div className="flex flex-col gap-6 h-full">
                        
                        {/* Alerta de Sincronización */}
                        {(pendingSyncs > 0 || failedSyncs > 0) && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4">
                                <AlertCircle className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-200">Estado de Sincronización</h4>
                                    <p className="text-sm text-amber-500 mt-1">
                                        {failedSyncs > 0
                                          ? `Hay ${failedSyncs} ${failedSyncs === 1 ? "venta" : "ventas"} con error de sincronización y ${Math.max(0, pendingSyncs - failedSyncs)} pendientes por subir.`
                                          : `Tienes ${pendingSyncs} ${pendingSyncs === 1 ? "venta" : "ventas"} pendientes de sincronizar con la nube.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tabla de Reposición */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex-1">
                            <h3 className="text-lg font-semibold text-slate-200 mb-4">Atención de Stock</h3>
                            {lowStock.length === 0 ? (
                                <div className="text-sm text-emerald-500/80 italic mt-4 text-center">Tu inventario está en óptimas condiciones.</div>
                            ) : (
                                <div className="overflow-auto max-h-[250px] pr-2 custom-scrollbar">
                                    <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-slate-900/90 text-slate-500 text-xs uppercase z-10">
                                            <tr>
                                                <th className="font-semibold py-2">Producto</th>
                                                <th className="font-semibold py-2 text-right">Queda</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStock.map(p => (
                                                <tr key={p.id} className="bg-slate-800/40 hover:bg-slate-800/60 transition group">
                                                    <td className="py-2 px-2 rounded-l-lg border-y border-l border-slate-700/50">
                                                        <div className="font-medium text-slate-300 truncate max-w-[200px]">{p.nombre}</div>
                                                    </td>
                                                    <td className="py-2 px-2 rounded-r-lg border-y border-r border-slate-700/50 text-right">
                                                        <span className="inline-flex items-center justify-center min-w-8 h-6 rounded-md bg-rose-500/20 text-rose-300 font-bold font-mono">
                                                            {p.cantidad || 0}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 2: REPORTE DE VENTAS DETALLADO --- */}
            <section className="space-y-6 border-t border-slate-800 pt-8 mt-8">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Filter className="text-indigo-400" /> Reporte de Ventas
                </h2>
                <SalesReportTable ventas={ventas} clientes={clientes} pagosCuotas={pagosCuotas} formatCurrency={formatCurrency} />
            </section>
        </div>
    );
}

/** Tarjetita utilitaria para métricas */
function MetricCard({ title, value, subtext, icon, intent = "normal", onClick, className = "" }) {
    const intents = {
        normal: "border-slate-800 bg-slate-900/60 text-slate-100",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-50",
        danger: "border-rose-500/30 bg-rose-500/10 text-rose-50",
    };

    return (
        <div 
            onClick={onClick}
            className={`rounded-2xl border p-5 flex flex-col justify-between ${intents[intent]} ${className}`}
        >
            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold opacity-80">{title}</p>
                <div className="p-2 rounded-xl bg-slate-950/50">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black tracking-tight">{value}</h3>
                {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

/**
 * Componente: Tabla de Reporte de Ventas con Filtros
 */
function SalesReportTable({ ventas, clientes, pagosCuotas = [], formatCurrency }) {
    const [dateFilter, setDateFilter] = useState("today");

    const getDateBounds = () => {
        const hoy = new Date();
        const startOfToday = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
        const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime();
        const startOf7Days = startOfToday - (7 * 24 * 60 * 60 * 1000);
        return { startOfToday, startOfMonth, startOf7Days };
    };

    // Filtrar Ventas
    const filteredSales = useMemo(() => {
        if (!ventas) return [];
        const { startOfToday, startOfMonth, startOf7Days } = getDateBounds();
        return ventas.filter(v => {
            const saleDate = new Date(v.fecha).getTime();
            if (dateFilter === "today") return saleDate >= startOfToday;
            if (dateFilter === "7days") return saleDate >= startOf7Days;
            if (dateFilter === "month") return saleDate >= startOfMonth;
            return true;
        }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [ventas, dateFilter]);

    // Filtrar Cobranzas del mismo periodo
    const filteredCobranzas = useMemo(() => {
        if (!pagosCuotas) return [];
        const { startOfToday, startOfMonth, startOf7Days } = getDateBounds();
        return pagosCuotas.filter(p => {
            const pDate = new Date(p.fecha).getTime();
            if (dateFilter === "today") return pDate >= startOfToday;
            if (dateFilter === "7days") return pDate >= startOf7Days;
            if (dateFilter === "month") return pDate >= startOfMonth;
            return true;
        });
    }, [pagosCuotas, dateFilter]);

    // Resumen del filtro actual
    const { totalSales, ticketCount } = useMemo(() => {
        const total = filteredSales.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
        return { totalSales: total, ticketCount: filteredSales.length };
    }, [filteredSales]);

    const totalCobranzas = useMemo(() =>
        filteredCobranzas.reduce((acc, p) => acc + Number(p.monto || 0), 0),
        [filteredCobranzas]
    );

    const averageTicket = ticketCount > 0 ? (totalSales / ticketCount) : 0;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
            
            {/* Controles de Filtros y Sumario Rápido */}
            <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90">
                <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <FilterBtn active={dateFilter === "today"} onClick={() => setDateFilter("today")}>Hoy</FilterBtn>
                    <FilterBtn active={dateFilter === "7days"} onClick={() => setDateFilter("7days")}>Últimos 7 días</FilterBtn>
                    <FilterBtn active={dateFilter === "month"} onClick={() => setDateFilter("month")}>Este Mes</FilterBtn>
                    <FilterBtn active={dateFilter === "all"} onClick={() => setDateFilter("all")}>Histórico Completo</FilterBtn>
                </div>
                
                <div className="flex items-center gap-6 px-2 flex-wrap">
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets Emitidos</p>
                        <p className="text-lg font-bold text-slate-200">{ticketCount}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
                        <p className="text-lg font-bold text-slate-300">{formatCurrency(averageTicket)}</p>
                    </div>
                    <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6 sm:ml-2">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Ingreso Total</p>
                        <p className="text-xl font-black text-emerald-400">{formatCurrency(totalSales + totalCobranzas)}</p>
                        <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-slate-500">
                            <span>Ventas: {formatCurrency(totalSales)}</span>
                            {totalCobranzas > 0 && <span className="text-amber-400">Cobranzas: {formatCurrency(totalCobranzas)}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Resultados */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Tipo / Pago</th>
                            <th className="px-6 py-4 font-semibold">Estado de Red</th>
                            <th className="px-6 py-4 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredSales.length === 0 && filteredCobranzas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">
                                    No hay registros en el periodo seleccionado.
                                </td>
                            </tr>
                        ) : (
                            [...filteredSales.map(v => ({ ...v, _tipo: "venta" })),
                             ...filteredCobranzas.map(p => ({ ...p, _tipo: "cobro" }))]
                              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                              .map((row) => {
                                if (row._tipo === "cobro") {
                                    return (
                                        <tr key={`cobro-${row.id}`} className="hover:bg-amber-500/5 transition bg-amber-500/3 border-l-2 border-l-amber-500/30">
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(row.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {row.cliente_nombre || <span className="text-slate-500 italic">Sin nombre</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                        Cobro CC
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                                        {row.metodo_pago || "Efectivo"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                                                    row.synced === 0
                                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                }`}>
                                                    {row.synced === 0 ? "En cola offline" : "Guardado en Nube"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-amber-300">
                                                {formatCurrency(row.monto)}
                                            </td>
                                        </tr>
                                    );
                                }

                                const isPending = row.synced === 0 || row.synced === undefined || row.synced === null;
                                const isFailed = row.sync_status === "failed";
                                return (
                                    <tr key={`venta-${row.id}`} className="hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 text-slate-300">
                                            {new Date(row.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {row.clienteNombre || <span className="text-slate-500 italic">Consumidor Final</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                                                row.enCuentaCorriente ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                            }`}>
                                                {row.metodoPago || "Efectivo"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isFailed ? (
                                                <span className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">Error al subir</span>
                                            ) : isPending ? (
                                                <span className="text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">En cola offline</span>
                                            ) : (
                                                <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">Guardado en Nube</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                            {formatCurrency(row.total)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

function FilterBtn({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                active ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
        >
            {children}
        </button>
    );
}
