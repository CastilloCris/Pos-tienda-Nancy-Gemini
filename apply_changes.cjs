const fs = require('fs');

let content = fs.readFileSync('src/components/pos/Sections.jsx', 'utf8');

// Prompt 1
content = content.replace(
  '<div className="flex flex-col gap-6 xl:flex-row">',
  '<div className="flex flex-col gap-6 xl:flex-row xl:items-start">'
);
content = content.replace(
  '<form onSubmit={(event) => { event.preventDefault(); saveProduct(); }} className={`${panel} w-full xl:max-w-[340px] xl:shrink-0 space-y-4`}>',
  '<form onSubmit={(event) => { event.preventDefault(); saveProduct(); }} className={`${panel} w-full xl:max-w-[340px] xl:shrink-0 xl:sticky xl:top-4 space-y-4`}>'
);

// Prompt 2 - Imports
if (!content.includes('Edit2')) {
  content = content.replace(
    'import { Banknote, Camera, Cloud, Download, MessageCircle, Printer, ScanLine, Trash2, UserRound, Search, RefreshCw, AlertCircle } from "lucide-react";',
    'import { Banknote, Camera, Cloud, Download, Edit2, MessageCircle, Printer, ScanLine, Trash2, UserRound, Search, RefreshCw, AlertCircle } from "lucide-react";'
  );
}

// Prompt 2 - Props
const propsTarget = `  onSync,
  onForceRescan,
  syncStatus,
}) {`;
const propsReplacement = `  onSync,
  onForceRescan,
  syncStatus,
  onDeleteVenta,
  imprimirTicket,
}) {`;
content = content.replace(propsTarget, propsReplacement);

// Prompt 2 - Thead
const theadTarget = `            <thead className="bg-slate-950">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Metodo</th>
                <th className="px-6 py-4">Articulos vendidos</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>`;
const theadReplacement = `            <thead className="bg-slate-950">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Detalle de artículos</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>`;
// thead could have CRLF
content = content.replace(theadTarget, theadReplacement);
content = content.replace(theadTarget.replace(/\n/g, '\r\n'), theadReplacement);

// Prompt 2 - Cobro
const cobroTarget = `<td className="px-6 py-4 text-slate-500 italic">Pago de cuenta corriente</td>
                        <td className="px-6 py-4 font-bold text-amber-300">{currency.format(Number(row.monto || 0))}</td>
                      </tr>`;
const cobroReplacement = `<td className="px-6 py-4 text-slate-500 italic">Pago de cuenta corriente</td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 font-bold text-amber-300">{currency.format(Number(row.monto || 0))}</td>
                        <td className="px-6 py-4"></td>
                      </tr>`;
content = content.replace(cobroTarget, cobroReplacement);
content = content.replace(cobroTarget.replace(/\n/g, '\r\n'), cobroReplacement);

// Prompt 2 - Venta
const ventaTarget = `                      <td className="px-6 py-4">{(row.articulos || []).map((item) => \`\${item.nombre} · \${item.talle || 'Unico'}\`).join(' | ') || '-'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{currency.format(Number(row.total || 0))}</td>
                    </tr>`;
const ventaReplacement = `                      <td className="px-6 py-4">
                        {(row.articulos || []).length === 0 ? (
                          <span className="text-slate-500 italic">Sin detalle</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {(row.articulos || []).map((item, i) => (
                              <span key={i} className="text-slate-300">
                                <span className="font-medium text-slate-100">{item.nombre}</span>
                                {item.talle ? \` · T: \${item.talle}\` : ""}
                                {" · "}<span className="text-slate-400">x{item.cantidad}</span>
                                {" · "}<span className="text-emerald-400">{currency.format(item.precio)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {Number(row.descuentoAplicado || 0) > 0
                          ? <span className="text-rose-400 font-semibold">-{currency.format(Number(row.descuentoAplicado))}</span>
                          : <span className="text-slate-600">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{currency.format(Number(row.total || 0))}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => imprimirTicket && imprimirTicket(row)}
                            title="Reimprimir ticket"
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-indigo-500 hover:text-indigo-300"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteVenta && onDeleteVenta(row.id)}
                            title="Eliminar venta"
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>`;
content = content.replace(ventaTarget, ventaReplacement);
content = content.replace(ventaTarget.replace(/\n/g, '\r\n'), ventaReplacement);

fs.writeFileSync('src/components/pos/Sections.jsx', content, 'utf8');
console.log('DONE');
