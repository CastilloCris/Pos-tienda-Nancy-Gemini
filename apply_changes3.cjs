const fs = require('fs');

let appContent = fs.readFileSync('src/App.jsx', 'utf8');

const appTarget = `{tab === "dashboard" ? <DashboardSection ventas={ventas} productos={inventario} clientes={clientes} pagosCuotas={pagosCuotas} onNavigate={(to, state) => { setTab(to); setNavState(state); }} /> : null}`;
const appReplacement = `{tab === "dashboard" ? <DashboardSection ventas={ventas} productos={inventario} clientes={clientes} pagosCuotas={pagosCuotas} onNavigate={(to, state) => { setTab(to); setNavState(state); }} onDeleteVenta={handleDeleteVenta} imprimirTicket={imprimirTicket} /> : null}`;

if (appContent.includes(appTarget)) {
  appContent = appContent.replace(appTarget, appReplacement);
}
fs.writeFileSync('src/App.jsx', appContent, 'utf8');


let dashboardContent = fs.readFileSync('src/components/pos/DashboardSection.jsx', 'utf8');

// Imports
dashboardContent = dashboardContent.replace(
  'import { BarChart3, TrendingUp, AlertCircle, ShoppingCart, Filter } from "lucide-react";',
  'import { BarChart3, TrendingUp, AlertCircle, ShoppingCart, Filter, Printer, Trash2 } from "lucide-react";'
);

// DashboardSection Props
dashboardContent = dashboardContent.replace(
  'export function DashboardSection({ ventas, productos, clientes, pagosCuotas = [], onNavigate }) {',
  'export function DashboardSection({ ventas, productos, clientes, pagosCuotas = [], onNavigate, onDeleteVenta, imprimirTicket }) {'
);

// SalesReportTable invocation
dashboardContent = dashboardContent.replace(
  '<SalesReportTable ventas={ventas} clientes={clientes} pagosCuotas={pagosCuotas} formatCurrency={formatCurrency} />',
  '<SalesReportTable ventas={ventas} clientes={clientes} pagosCuotas={pagosCuotas} formatCurrency={formatCurrency} onDeleteVenta={onDeleteVenta} imprimirTicket={imprimirTicket} />'
);

// SalesReportTable Props
dashboardContent = dashboardContent.replace(
  'function SalesReportTable({ ventas, clientes, pagosCuotas = [], formatCurrency }) {',
  'function SalesReportTable({ ventas, clientes, pagosCuotas = [], formatCurrency, onDeleteVenta, imprimirTicket }) {'
);

// thead
const theadTarget = `                        <tr>
                            <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Tipo / Pago</th>
                            <th className="px-6 py-4 font-semibold">Estado de Red</th>
                            <th className="px-6 py-4 font-semibold text-right">Total</th>
                        </tr>`;
const theadReplacement = `                        <tr>
                            <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Tipo / Pago</th>
                            <th className="px-6 py-4 font-semibold">Detalle de artículos</th>
                            <th className="px-6 py-4 font-semibold">Descuento</th>
                            <th className="px-6 py-4 font-semibold">Estado de Red</th>
                            <th className="px-6 py-4 font-semibold text-right">Total</th>
                            <th className="px-6 py-4 font-semibold">Acciones</th>
                        </tr>`;

if (dashboardContent.includes(theadTarget)) {
  dashboardContent = dashboardContent.replace(theadTarget, theadReplacement);
} else {
  dashboardContent = dashboardContent.replace(theadTarget.replace(/\\n/g, '\\r\\n'), theadReplacement);
}

// cobro
const cobroTarget = `                                            <td className="px-6 py-4">
                                                <span className={\`text-xs font-bold px-2 py-1 rounded-md border \${
                                                    row.synced === 0
                                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                }\`}>
                                                    {row.synced === 0 ? "En cola offline" : "Guardado en Nube"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-amber-300">
                                                {formatCurrency(row.monto)}
                                            </td>
                                        </tr>`;

const cobroReplacement = `                                            <td className="px-6 py-4 text-slate-500 italic text-xs">Pago de cuenta corriente</td>
                                            <td className="px-6 py-4"><span className="text-slate-600">—</span></td>
                                            <td className="px-6 py-4">
                                                <span className={\`text-xs font-bold px-2 py-1 rounded-md border \${
                                                    row.synced === 0
                                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                }\`}>
                                                    {row.synced === 0 ? "En cola offline" : "Guardado en Nube"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-amber-300">
                                                {formatCurrency(row.monto)}
                                            </td>
                                            <td className="px-6 py-4"></td>
                                        </tr>`;

if (dashboardContent.includes(cobroTarget)) {
  dashboardContent = dashboardContent.replace(cobroTarget, cobroReplacement);
} else {
  dashboardContent = dashboardContent.replace(cobroTarget.replace(/\\n/g, '\\r\\n'), cobroReplacement);
}

// venta
const ventaTarget = `                                        <td className="px-6 py-4">
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
                                    </tr>`;

const ventaReplacement = `                                        <td className="px-6 py-4 whitespace-normal max-w-xs">
                                          {(row.articulos || []).length === 0 ? (
                                            <span className="text-slate-500 italic">Sin detalle</span>
                                          ) : (
                                            <div className="flex flex-col gap-1">
                                              {(row.articulos || []).map((item, i) => (
                                                <span key={i} className="text-slate-300 text-xs leading-snug">
                                                  <span className="font-medium text-slate-100">{item.nombre}</span>
                                                  {item.talle ? \` · T: \${item.talle}\` : ""}
                                                  {" · "}<span className="text-slate-400">x{item.cantidad}</span>
                                                  {" · "}<span className="text-emerald-400">{formatCurrency(item.precio)}</span>
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-6 py-4">
                                          {Number(row.descuentoAplicado || 0) > 0
                                            ? <span className="text-rose-400 font-semibold text-xs">{formatCurrency(Number(row.descuentoAplicado))}</span>
                                            : <span className="text-slate-600">—</span>
                                          }
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
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => imprimirTicket && imprimirTicket(row)}
                                              title="Reimprimir ticket"
                                              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-indigo-500 hover:text-indigo-300"
                                            >
                                              <Printer size={13} />
                                            </button>
                                            <button
                                              onClick={() => onDeleteVenta && onDeleteVenta(row.id)}
                                              title="Eliminar venta"
                                              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                    </tr>`;

if (dashboardContent.includes(ventaTarget)) {
  dashboardContent = dashboardContent.replace(ventaTarget, ventaReplacement);
} else {
  dashboardContent = dashboardContent.replace(ventaTarget.replace(/\\n/g, '\\r\\n'), ventaReplacement);
}

fs.writeFileSync('src/components/pos/DashboardSection.jsx', dashboardContent, 'utf8');
console.log('DONE');
