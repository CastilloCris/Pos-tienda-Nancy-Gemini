const fs = require('fs');

let appContent = fs.readFileSync('src/App.jsx', 'utf8');

const appTarget = `{tab === "resumen" ? <SummarySection ventas={ventas} cajas={cajas} pagosCuotas={pagosCuotas} exportBackupJson={exportBackupJson} onImportBackupClick={onImportBackupClick} backupInputRef={backupInputRef} handleImportBackup={handleImportBackup} cajaAbiertaHoy={cajaAbiertaHoy} setCierreCajaOpen={setCierreCajaOpen} setAperturaCajaOpen={setAperturaCajaOpen} clearHistory={clearHistory} totalCobrado={totalCobrado} totalCuentaCorriente={totalCuentaCorriente} montoAperturaCaja={montoAperturaCaja} ventasEfectivoHoy={ventasEfectivoHoy} ventasOtrosMediosHoy={ventasOtrosMediosHoy} cobranzasEfectivoHoy={cobranzasEfectivoHoy} cobranzasOtrosMediosHoy={cobranzasOtrosMediosHoy} efectivoEsperadoCaja={efectivoEsperadoCaja} cajaDelDia={cajaDelDia} boxReportToPrint={boxReportToPrint} setPrintMode={setPrintMode} setBoxReportToPrint={setBoxReportToPrint} onSync={runAutoSync} onForceRescan={handleForceRescan} syncStatus={syncStatus} /> : null}`;
const appReplacement = `{tab === "resumen" ? <SummarySection ventas={ventas} cajas={cajas} pagosCuotas={pagosCuotas} exportBackupJson={exportBackupJson} onImportBackupClick={onImportBackupClick} backupInputRef={backupInputRef} handleImportBackup={handleImportBackup} cajaAbiertaHoy={cajaAbiertaHoy} setCierreCajaOpen={setCierreCajaOpen} setAperturaCajaOpen={setAperturaCajaOpen} clearHistory={clearHistory} totalCobrado={totalCobrado} totalCuentaCorriente={totalCuentaCorriente} montoAperturaCaja={montoAperturaCaja} ventasEfectivoHoy={ventasEfectivoHoy} ventasOtrosMediosHoy={ventasOtrosMediosHoy} cobranzasEfectivoHoy={cobranzasEfectivoHoy} cobranzasOtrosMediosHoy={cobranzasOtrosMediosHoy} efectivoEsperadoCaja={efectivoEsperadoCaja} cajaDelDia={cajaDelDia} boxReportToPrint={boxReportToPrint} setPrintMode={setPrintMode} setBoxReportToPrint={setBoxReportToPrint} onSync={runAutoSync} onForceRescan={handleForceRescan} syncStatus={syncStatus} onDeleteVenta={handleDeleteVenta} imprimirTicket={imprimirTicket} /> : null}`;

if (appContent.includes(appTarget)) {
  appContent = appContent.replace(appTarget, appReplacement);
}
fs.writeFileSync('src/App.jsx', appContent, 'utf8');

let sectionContent = fs.readFileSync('src/components/pos/Sections.jsx', 'utf8');

// SummarySection Props
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

if (sectionContent.includes(propsTarget)) {
  sectionContent = sectionContent.replace(propsTarget, propsReplacement);
} else if (sectionContent.includes(propsTarget.replace(/\\n/g, '\\r\\n'))) {
  sectionContent = sectionContent.replace(propsTarget.replace(/\\n/g, '\\r\\n'), propsReplacement);
}

// <thead>
const theadTarget = `<tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Metodo</th>
                <th className="px-6 py-4">Articulos vendidos</th>
                <th className="px-6 py-4">Total</th>
              </tr>`;
const theadReplacement = `<tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Metodo</th>
                <th className="px-6 py-4">Detalle</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>`;

if (sectionContent.includes(theadTarget)) {
  sectionContent = sectionContent.replace(theadTarget, theadReplacement);
} else if (sectionContent.includes(theadTarget.replace(/\\n/g, '\\r\\n'))) {
  sectionContent = sectionContent.replace(theadTarget.replace(/\\n/g, '\\r\\n'), theadReplacement);
}

// cobros
const cobroTarget = `                        <td className="px-6 py-4 text-slate-500 italic">Pago de cuenta corriente</td>
                        <td className="px-6 py-4 font-bold text-amber-300">{currency.format(Number(row.monto || 0))}</td>
                      </tr>`;
const cobroReplacement = `                        <td className="px-6 py-4 text-slate-500 italic">Pago de cuenta corriente</td>
                        <td className="px-6 py-4"><span className="text-slate-600">—</span></td>
                        <td className="px-6 py-4 font-bold text-amber-300">{currency.format(Number(row.monto || 0))}</td>
                        <td className="px-6 py-4"></td>
                      </tr>`;

if (sectionContent.includes(cobroTarget)) {
  sectionContent = sectionContent.replace(cobroTarget, cobroReplacement);
} else if (sectionContent.includes(cobroTarget.replace(/\\n/g, '\\r\\n'))) {
  sectionContent = sectionContent.replace(cobroTarget.replace(/\\n/g, '\\r\\n'), cobroReplacement);
}

// venta
const ventaTarget = `                  return (
                    <tr key={\`venta-\${row.id}\`} className="align-top text-sm text-slate-400">
                      <td className="px-6 py-4 font-medium text-slate-100">{new Date(row.fecha).toLocaleDateString('es-AR')} {new Date(row.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4">{row.clienteNombre || 'Consumidor final'}</td>
                      <td className={\`px-6 py-4 \${row.enCuentaCorriente ? 'text-amber-300' : 'text-slate-300'}\`}>{row.metodoPago || '-'}</td>
                      <td className="px-6 py-4">{(row.articulos || []).map((item) => \`\${item.nombre} · \${item.talle || 'Unico'}\`).join(' | ') || '-'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{currency.format(Number(row.total || 0))}</td>
                    </tr>
                  );`;
const ventaReplacement = `                  return (
                    <tr key={\`venta-\${row.id}\`} className="align-top text-sm text-slate-400">
                      <td className="px-6 py-4 font-medium text-slate-100">{new Date(row.fecha).toLocaleDateString('es-AR')} {new Date(row.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4">{row.clienteNombre || 'Consumidor final'}</td>
                      <td className={\`px-6 py-4 \${row.enCuentaCorriente ? 'text-amber-300' : 'text-slate-300'}\`}>{row.metodoPago || '-'}</td>
                      <td className="px-6 py-4 whitespace-normal max-w-xs">
                        {(row.articulos || []).length === 0 ? (
                          <span className="text-slate-500 italic">Sin detalle</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {(row.articulos || []).map((item, i) => (
                              <span key={i} className="text-xs leading-snug text-slate-300">
                                <span className="font-medium text-slate-100">{item.nombre}</span>
                                {item.talle ? \` · T: \${item.talle}\` : ''}
                                {' · '}<span className="text-slate-400">x{item.cantidad}</span>
                                {' · '}<span className="text-emerald-400">{currency.format(item.precio)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {Number(row.descuentoAplicado || 0) > 0
                          ? <span className="text-rose-400 font-semibold text-xs">{currency.format(Number(row.descuentoAplicado))}</span>
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
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Eliminar esta venta del historial? Esta acción no se puede deshacer.')) {
                                onDeleteVenta && onDeleteVenta(row.id);
                              }
                            }}
                            title="Eliminar venta"
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );`;

if (sectionContent.includes(ventaTarget)) {
  sectionContent = sectionContent.replace(ventaTarget, ventaReplacement);
} else if (sectionContent.includes(ventaTarget.replace(/\\n/g, '\\r\\n'))) {
  sectionContent = sectionContent.replace(ventaTarget.replace(/\\n/g, '\\r\\n'), ventaReplacement);
}

fs.writeFileSync('src/components/pos/Sections.jsx', sectionContent, 'utf8');
console.log('DONE');
