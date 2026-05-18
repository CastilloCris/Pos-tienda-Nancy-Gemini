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

// Button onClick confirm
const btnTarget = `                          <button
                            onClick={() => onDeleteVenta && onDeleteVenta(row.id)}
                            title="Eliminar venta"
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                          >`;
const btnReplacement = `                          <button
                            onClick={() => {
                              if (window.confirm("¿Eliminar esta venta del historial? Esta acción no se puede deshacer.")) {
                                onDeleteVenta && onDeleteVenta(row.id);
                              }
                            }}
                            title="Eliminar venta"
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                          >`;

if (sectionContent.includes(btnTarget)) {
  sectionContent = sectionContent.replace(btnTarget, btnReplacement);
} else if (sectionContent.includes(btnTarget.replace(/\\n/g, '\\r\\n'))) {
  sectionContent = sectionContent.replace(btnTarget.replace(/\\n/g, '\\r\\n'), btnReplacement);
}

fs.writeFileSync('src/components/pos/Sections.jsx', sectionContent, 'utf8');
console.log('DONE');
