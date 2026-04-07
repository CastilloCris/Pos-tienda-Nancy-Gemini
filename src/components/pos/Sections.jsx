import { Banknote, Camera, Cloud, Download, MessageCircle, Printer, ScanLine, Trash2, UserRound, Search, RefreshCw, AlertCircle } from "lucide-react";
import ProductCard from "../ProductCard";
import { currency, csv, download, panel } from "../../utils/helpers";
import { Buscador, Campo, SummaryCard, TicketPanel, CameraScanner, SalesSidebar } from "./Controls";
import { ClientesTable, InventarioTable } from "./Tables";
import { useAuth } from "../../contexts/AuthContext";

export const SalesSection = ({
  busqueda,
  setBusqueda,
  categoriaFiltro,
  setCategoriaFiltro,
  inventario,
  cameraOpen,
  setCameraError,
  setCameraOpen,
  closeCameraScanner,
  cameraContainerId,
  cameraLoading,
  cameraError,
  lastDetectedCode,
  productos,
  addToCart,
  scannerCodigo,
  setScannerCodigo,
  processCode,
  handleSalesCodeSubmit,
  scannerRef,
  carrito,
  setCarrito,
  metodoPago,
  setMetodoPago,
  montoDescuento,
  setMontoDescuento,
  imprimirTicket,
  finalizar,
  clientes,
  anotarEnCuentaCorriente,
  setAnotarEnCuentaCorriente,
  clienteSeleccionadoId,
  setClienteSeleccionadoId,
  clienteVentaRapida,
  setClienteVentaRapida,
}) => {
  const submitManualCode = () => {
    console.log("[sales-flow] manual submit", { value: scannerCodigo, trimmed: String(scannerCodigo ?? "").trim() });
    handleSalesCodeSubmit(scannerCodigo, "manual-submit");
  };

  const categoriasU = ["Todos", ...new Set(inventario.map(p => p.categoria).filter(Boolean))];

  const productosMostrar = productos.filter(p => categoriaFiltro === "" || categoriaFiltro === "Todos" || p.categoria === categoriaFiltro);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <section className="min-w-0 flex-1 space-y-6">
        <section className={panel}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Escaner</p>
              <h2 className="mt-2 text-xl font-bold text-slate-100">Lectura de codigo de barras</h2>
              <p className="mt-2 text-sm text-slate-400">Listo para scanner fisico, entrada manual y camara del celular.</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Escaner listo</div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <ScanLine size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input ref={scannerRef} value={scannerCodigo} onChange={(event) => { console.log("[sales-flow] manual input change", { value: event.target.value }); setScannerCodigo(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); console.log("[sales-flow] manual input Enter", { value: scannerCodigo }); submitManualCode(); } }} placeholder="Escanea o escribe un codigo y presiona Enter" className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15" />
            </label>
            <button onClick={() => { console.log("[sales-flow] add button click", { value: scannerCodigo }); submitManualCode(); }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15"><ScanLine size={18} />Agregar</button>
          </div>
        </section>
        <section className={panel}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Ventas</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Seleccion boutique</h2>
          <p className="mt-2 text-sm text-slate-400">Busca, escanea o selecciona prendas manualmente.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, categoria, talle o codigo" />
            </div>
            <button onClick={() => { setCameraError(""); setCameraOpen((current) => !current); }} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${cameraOpen ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-slate-700 bg-slate-800 text-slate-100 hover:border-indigo-500 hover:bg-indigo-500/15"}`}><Camera size={18} />{cameraOpen ? "Cerrar camara" : "Camara"}</button>
          </div>
          <CameraScanner cameraOpen={cameraOpen} setCameraError={setCameraError} setCameraOpen={setCameraOpen} closeCameraScanner={closeCameraScanner} cameraContainerId={cameraContainerId} cameraLoading={cameraLoading} cameraError={cameraError} lastDetectedCode={lastDetectedCode} />
          {categoriasU.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600">
              {categoriasU.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                    (categoriaFiltro === cat || (categoriaFiltro === "" && cat === "Todos"))
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            {productosMostrar.map((producto) => (
              <ProductCard key={producto.id} producto={producto} onAdd={addToCart} />
            ))}
            {!productosMostrar.length ? <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900 p-8 text-sm text-slate-400 xl:col-span-4">No hay productos para mostrar con esa busqueda.</div> : null}
          </div>
        </section>
      </section>
      <div className="w-full lg:max-w-[380px] lg:shrink-0">
        <SalesSidebar carrito={carrito} setCarrito={setCarrito} metodoPago={metodoPago} setMetodoPago={setMetodoPago} montoDescuento={montoDescuento} setMontoDescuento={setMontoDescuento} imprimirTicket={imprimirTicket} finalizar={finalizar} clientes={clientes} anotarEnCuentaCorriente={anotarEnCuentaCorriente} setAnotarEnCuentaCorriente={setAnotarEnCuentaCorriente} clienteSeleccionadoId={clienteSeleccionadoId} setClienteSeleccionadoId={setClienteSeleccionadoId} clienteVentaRapida={clienteVentaRapida} setClienteVentaRapida={setClienteVentaRapida} />
      </div>
    </div>
  );
}

export function InventorySection({
    navState,
    setNavState,
  form,
  setForm,
  fileInputRef,
  handleImageChange,
  saveProduct,
  editando,
  resetForm,
  busqueda,
  setBusqueda,
  inventarioFiltrado,
  editProduct,
  deleteProduct,
  openLabelDialog,
}) {
  const isStockFilterActive = navState?.filter === 'bajo-stock';
  
  // Si el filtro de stock está activo, pisamos la lista visual con solo los críticos
  const displayingProducts = isStockFilterActive 
    ? inventarioFiltrado.filter(p => Number(p.stock || 0) < Number(p.stock_minimo || 0))
    : inventarioFiltrado;

  return (
    <div className="space-y-6">
      <section className={panel}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Inventario</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Gestión de prendas</h2>
        <p className="mt-2 text-sm text-slate-400">Cada producto puede guardar una foto optimizada, un código para uso con escáner físico y etiquetas térmicas por talle.</p>
      </section>

      {/* BANNER SHORTCUT */}
      {isStockFilterActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-indigo-400" />
                <p className="text-sm font-medium text-indigo-200">Viendo productos críticos por reponer <span className="text-indigo-400 font-semibold">(Atajo del Dashboard)</span></p>
            </div>
            <button 
                onClick={() => setNavState(null)} 
                className="whitespace-nowrap rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition"
            >
                Ver todo el inventario
            </button>
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Formulario ─────────────────────────────────────────────── */}
        <form onSubmit={(event) => { event.preventDefault(); saveProduct(); }} className={`${panel} w-full xl:max-w-[340px] xl:shrink-0 space-y-4`}>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2.5">
              <Camera size={18} className="text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">{editando ? "Editando prenda" : "Nueva prenda"}</p>
              <p className="text-xs text-slate-500">{editando ? "Modificá los datos y guardá" : "Completá los datos y guardá"}</p>
            </div>
          </div>

          {/* Sección: Identificación */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Identificación</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Código</label>
                <Campo type="text" placeholder="Ej: 123456 (opcional)" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v })} />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Nombre <span className="text-rose-400">*</span></label>
                <Campo type="text" placeholder="Nombre del producto" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Precio ($)</label>
                <Campo type="number" step="0.01" placeholder="0.00" value={form.precio} onChange={(v) => setForm({ ...form, precio: v })} />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Categoría</label>
                <Campo type="text" placeholder="Ej: Pantalón" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-medium text-slate-400">Detalles</label>
              <Campo type="text" placeholder="Ej: Rojo Rayado" value={form.detalles} onChange={(v) => setForm({ ...form, detalles: v })} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-medium text-slate-400">Talles <span className="text-slate-600">(separados por guión)</span></label>
              <Campo type="text" placeholder="Ej: S-M-L-XL" value={form.talles} onChange={(v) => setForm({ ...form, talles: v })} />
            </div>
          </div>

          {/* Sección: Stock */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Stock</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Stock actual</label>
                <Campo type="number" min="0" placeholder="0" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-400">Mínimo (alerta)</label>
                <Campo type="number" min="0" placeholder="3" value={form.stock_minimo} onChange={(v) => setForm({ ...form, stock_minimo: v })} />
              </div>
            </div>
          </div>

          {/* Foto */}
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Foto del producto</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Opcional · se comprime automáticamente</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15 shrink-0">
                <Camera size={13} />
                Subir foto
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            {form.foto ? <img src={form.foto} alt="Preview" className="mt-3 h-32 w-full rounded-xl object-cover" /> : null}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 active:scale-95">
              {editando ? "Actualizar prenda" : "Guardar en inventario"}
            </button>
            {editando ? (
              <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {/* ── Tabla de inventario ─────────────────────────────────────── */}
        <section className={`${panel} min-w-0 flex-1`}>
          <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, nombre, categoría o talle" />
          <InventarioTable productos={displayingProducts} onEditar={editProduct} onEliminar={deleteProduct} onEtiqueta={openLabelDialog} />
        </section>
      </div>
    </div>
  );
}


export const ClientsSection = ({
  navState,
  setNavState,
  clienteBusqueda,
  setClienteBusqueda,
  clienteEditando,
  clienteForm,
  setClienteForm,
  saveCliente,
  resetClienteForm,
  clientesFiltrados,
  pagosClientes,
  setPagosClientes,
  metodoPagoCobro,
  setMetodoPagoCobro,
  registrarPagoCliente,
  editCliente,
  deleteCliente,
  handleSyncClientes,
}) => {
  const isDebtFilterActive = navState?.filter === 'con-deuda';
  
  // Si el filtro de deuda está activo, solo mostramos clientes con saldo pendiente
  const displayingClients = isDebtFilterActive 
    ? clientesFiltrados.filter(c => Number(c.deuda || 0) > 0)
    : clientesFiltrados;

  return (
  <div className="space-y-6">
    <section className={panel}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Clientes</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Cuenta corriente</h2>
          <p className="mt-2 text-sm text-slate-400">Controla deudas, registra pagos y deja clientes listos para WhatsApp.</p>
        </div>
        <div className="max-w-sm flex-1 flex gap-2">
          <Buscador value={clienteBusqueda} onChange={setClienteBusqueda} placeholder="Buscar cliente por nombre o telefono" />
          <button onClick={handleSyncClientes} className="inline-flex min-w-max items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15" title="Sincronizar clientes con la nube">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </section>

    {/* BANNER SHORTCUT */}
    {isDebtFilterActive && (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3 text-amber-200">
              <AlertCircle size={20} className="text-amber-400" />
              <p className="text-sm font-medium">Viendo clientes con saldo pendiente (Atajo del Dashboard)</p>
          </div>
          <button 
              onClick={() => setNavState(null)} 
              className="whitespace-nowrap rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition"
          >
              Limpiar filtro y ver todo
          </button>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <form onSubmit={(event) => { event.preventDefault(); saveCliente(); }} className={panel}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><UserRound size={20} className="text-slate-100" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{clienteEditando ? "Editar cliente" : "Nuevo cliente"}</p>
            <p className="text-xs text-slate-400">Nombre, telefono y seguimiento de deuda.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input type="text" placeholder="Nombre del cliente" className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={clienteForm.nombre} onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })} />
          <input type="text" placeholder="Celular / WhatsApp" className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={clienteForm.telefono} onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
          <input type="text" placeholder="DNI (Opcional)" className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={clienteForm.dni || ""} onChange={(e) => setClienteForm({ ...clienteForm, dni: e.target.value })} />
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-indigo-400">{clienteEditando ? "Actualizar cliente" : "Guardar cliente"}</button>
          {clienteEditando ? <button type="button" onClick={resetClienteForm} className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700">Cancelar</button> : null}
        </div>
      </form>
      <div className="min-w-0 w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Seguimiento de deuda</h3>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input type="text" placeholder="Buscar por DNI, nombre o teléfono..." className="w-full rounded-xl border border-gray-700 bg-gray-800/80 p-3 pl-10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={clienteBusqueda} onChange={(e) => setClienteBusqueda(e.target.value)} />
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-800">
          <div className="overflow-x-auto">
            <ClientesTable clientes={displayingClients} pagos={pagosClientes} setPagos={setPagosClientes} onRegistrarPago={registrarPagoCliente} onEditar={editCliente} deleteCliente={deleteCliente} />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export function SummarySection({
  ventas,
  cajas,
  pagosCuotas = [],
  exportBackupJson,
  onImportBackupClick,
  backupInputRef,
  handleImportBackup,
  cajaAbiertaHoy,
  setAperturaCajaOpen,
  setCierreCajaOpen,
  clearHistory,
  totalCobrado,
  totalCuentaCorriente,
  montoAperturaCaja,
  ventasEfectivoHoy,
  ventasOtrosMediosHoy,
  cobranzasEfectivoHoy = 0,
  cobranzasOtrosMediosHoy = 0,
  efectivoEsperadoCaja,
  cajaDelDia,
  boxReportToPrint,
  setPrintMode,
  setBoxReportToPrint,
  onSync,
  onForceRescan,
  syncStatus,
}) {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Cloud Sync Section */}
      <section className={panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Nube & Sincronización</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Cloud className="text-indigo-400" /> Supabase Sync
            </h2>
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col gap-4">
          {user ? (
            <div className="flex flex-col gap-4 items-start">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-sm text-slate-300">
                  Conectado como <strong className="text-slate-100">{profile?.email || user.email}</strong>
                </p>
              </div>

              {/* Botón único de sincronización */}
              <button
                onClick={onSync}
                disabled={syncStatus?.status === 'syncing'}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncStatus?.status === 'syncing' ? 'animate-spin' : ''} />
                {syncStatus?.status === 'syncing' ? 'Sincronizando...' : 'Respaldar en la Nube'}
              </button>

              {/* Botón secundario: Forzar Re-escaneo Total */}
              <button
                onClick={onForceRescan}
                disabled={syncStatus?.status === 'syncing'}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                title="Descarga todas las ventas y productos de la nube e integra los faltantes"
              >
                <RefreshCw size={14} className={syncStatus?.status === 'syncing' ? 'animate-spin' : ''} />
                Forzar Re-escaneo Total
              </button>

              {/* Feedback de estado para el usuario */}
              {syncStatus?.status === 'success' && (
                <p className="text-sm text-emerald-400">✅ Todo sincronizado correctamente.</p>
              )}
              {syncStatus?.status === 'error' && syncStatus?.errorMessage && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <p className="font-semibold">No se pudo sincronizar</p>
                  <p className="mt-1 text-rose-400/80">
                    {syncStatus.errorSource === 'auth'
                      ? 'Problema de inicio de sesión. Recargá la página o volvé a entrar.'
                      : syncStatus.errorSource === 'ventas'
                      ? 'Las ventas no pudieron subirse. Intentá de nuevo más tarde.'
                      : 'Hubo un problema al conectar con la nube. Revisá tu internet e intentá de nuevo.'}
                  </p>
                </div>
              )}
              {syncStatus?.lastSync && syncStatus?.status !== 'syncing' && (
                <p className="text-xs text-slate-500">
                  Última sincronización: {new Date(syncStatus.lastSync).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Inicia sesión desde la pantalla principal para habilitar la sincronización con Supabase.
            </p>
          )}
        </div>
      </section>

      <section className={panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Resumen</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Resumen de ventas</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { if (ventas.length) download("ventas-nancy.csv", csv(ventas), "text/csv;charset=utf-8;"); }} className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15">
              <Download size={16} />
              Exportar a CSV
            </button>
            <button onClick={exportBackupJson} className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15">
              <Download size={16} />
              Exportar backup JSON
            </button>
            <button onClick={onImportBackupClick} className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15">
              <Download size={16} />
              Importar backup JSON
            </button>
            <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={handleImportBackup} className="hidden" />
            <button onClick={() => setAperturaCajaOpen(true)} disabled={cajaAbiertaHoy} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500">
              <Banknote size={16} />
              {cajaDelDia?.cerrada ? "Reabrir Caja" : "Abrir Caja"}
            </button>
            <button onClick={() => setCierreCajaOpen(true)} disabled={!cajaAbiertaHoy} className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500">
              <Banknote size={16} />
              Cerrar Caja
            </button>
            <button onClick={clearHistory} className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/15">
              <Trash2 size={16} />
              Vaciar historial
            </button>
          </div>
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-4">
        <SummaryCard title="Ventas Totales" value={currency.format(ventas.reduce((acc, venta) => acc + Number(venta.total || 0), 0))} panelClass={panel} />
        <SummaryCard title="Cobrado" value={currency.format(totalCobrado)} accent="text-emerald-400" panelClass={panel} />
        <SummaryCard title="Cuenta Corriente" value={currency.format(totalCuentaCorriente)} accent="text-amber-300" panelClass={panel} />
        <SummaryCard title="Operaciones" value={ventas.length} panelClass={panel} />
      </div>
      <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Cloud size={18} />
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">Estado de la Nube</p>
            </div>
            {syncStatus?.status === 'syncing' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </div>
          
          <h3 className="mt-2 text-2xl font-bold text-slate-100">Sincronización Maestra</h3>
          
          <div className="mt-6 flex flex-col gap-4">
            <button
              onClick={onSync}
              disabled={syncStatus.status === "syncing"}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-500 px-6 py-5 text-lg font-bold text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-500/30 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              {syncStatus.status === "syncing" ? (
                <>
                  <RefreshCw size={24} className="animate-spin text-indigo-400" />
                  <span>Sincronizando datos...</span>
                </>
              ) : (
                <>
                  <Cloud size={24} className="transition-transform group-hover:-translate-y-1" />
                  <span>Sincronizar y Respaldar ahora</span>
                </>
              )}
            </button>

            {/* Mensajes de Feedback */}
            {syncStatus.status === "idle" && syncStatus.lastSync === null && (
               <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center text-sm font-medium text-slate-400">
                 Presiona el botón para asegurar tus datos
               </div>
            )}

            {syncStatus.status === "success" && (
               <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-300">
                 ¡Todo sincronizado! Tu información está segura en la nube.
               </div>
            )}
            
            {syncStatus.status === "error" && (
               <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-sm font-medium text-rose-300 flex flex-col gap-1">
                 <span>No pudimos sincronizar. Revisa tu conexión a internet e intenta de nuevo.</span>
                 {syncStatus.errorMessage && <span className="text-xs opacity-80">{syncStatus.errorMessage}</span>}
               </div>
            )}

            {/* Historial de Confianza */}
            <div className="text-center text-xs text-slate-500 mt-2">
              {syncStatus.lastSync ? (
                <span>Último respaldo: {new Date(syncStatus.lastSync).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
              ) : (
                <span>No hay registros de sincronización reciente.</span>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400">
            <Banknote size={18} />
            <p className="text-xs font-semibold uppercase tracking-[0.28em]">Estado de Caja Actual</p>
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">Caja del {new Date().toLocaleDateString("es-AR")}</h3>
          <div className="mt-6 grid gap-4 grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl flex flex-col justify-between border border-slate-800 bg-slate-950/80 p-4 md:p-5">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-slate-500">Inicio</p>
              <p className="mt-3 text-xl md:text-2xl font-bold text-emerald-300 truncate">{currency.format(montoAperturaCaja)}</p>
            </div>
            <div className="rounded-3xl flex flex-col justify-between border border-slate-800 bg-slate-950/80 p-4 md:p-5">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-slate-500">Ventas efectivo</p>
              <p className="mt-3 text-xl md:text-2xl font-bold text-slate-100 truncate">{currency.format(ventasEfectivoHoy)}</p>
            </div>
            <div className="rounded-3xl flex flex-col justify-between border border-slate-800 bg-slate-950/80 p-4 md:p-5">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-slate-500">Otros medios (ventas)</p>
              <p className="mt-3 text-xl md:text-2xl font-bold text-indigo-300 truncate">{currency.format(ventasOtrosMediosHoy)}</p>
            </div>
            {cobranzasEfectivoHoy > 0 && (
              <div className="rounded-3xl flex flex-col justify-between border border-amber-500/20 bg-amber-500/5 p-4 md:p-5">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-amber-500">Cobranzas Efectivo</p>
                <p className="mt-3 text-xl md:text-2xl font-bold text-amber-300 truncate">{currency.format(cobranzasEfectivoHoy)}</p>
              </div>
            )}
            {cobranzasOtrosMediosHoy > 0 && (
              <div className="rounded-3xl flex flex-col justify-between border border-amber-500/20 bg-amber-500/5 p-4 md:p-5">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-amber-500">Cobranzas Transfer.</p>
                <p className="mt-3 text-xl md:text-2xl font-bold text-amber-300 truncate">{currency.format(cobranzasOtrosMediosHoy)}</p>
              </div>
            )}
            <div className="rounded-3xl flex flex-col justify-between border border-slate-800 bg-slate-950/80 p-4 md:p-5">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-slate-500 line-clamp-2 md:line-clamp-none">A rendir (Efvo)</p>
              <p className="mt-3 text-xl md:text-2xl font-bold text-amber-300 truncate">{currency.format(efectivoEsperadoCaja)}</p>
            </div>
          </div>
          <div className={`mt-6 rounded-3xl border px-5 py-4 text-sm font-semibold ${cajaAbiertaHoy ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : cajaDelDia?.cerrada ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-slate-800 bg-slate-950/80 text-slate-300"}`}>
            {cajaAbiertaHoy ? "Caja abierta y lista para operar." : cajaDelDia?.cerrada ? `Caja cerrada a las ${new Date(cajaDelDia.fechaCierre).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}.` : "Todavia no se registro una apertura de caja para hoy."}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">Ultimo cierre</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">Resultado del conteo</h3>
          {cajaDelDia?.cerrada ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Monto real contado</p><p className="mt-3 text-2xl font-bold text-slate-100">{currency.format(Number(cajaDelDia.montoCierreReal || 0))}</p></div>
              <div className={`rounded-3xl border p-4 ${Number(cajaDelDia.diferenciaCierre || 0) === 0 ? "border-slate-800 bg-slate-950/80 text-slate-200" : Number(cajaDelDia.diferenciaCierre || 0) > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                {Number(cajaDelDia.diferenciaCierre || 0) === 0 ? "Sin diferencia en el cierre." : Number(cajaDelDia.diferenciaCierre || 0) > 0 ? `Sobrante: ${currency.format(Number(cajaDelDia.diferenciaCierre || 0))}.` : `Faltante: ${currency.format(Math.abs(Number(cajaDelDia.diferenciaCierre || 0)))}.`}
              </div>
              <button onClick={() => { if (boxReportToPrint) { setPrintMode("box-report"); return; } setBoxReportToPrint({ cajaId: cajaDelDia.id, fechaClave: cajaDelDia.fechaClave, fechaCierre: cajaDelDia.fechaCierre, montoApertura: Number(cajaDelDia.montoApertura || 0), ventasEfectivo: Number(cajaDelDia.ventasEfectivo || 0), ventasOtrosMedios: Number(cajaDelDia.ventasOtrosMedios || 0), cobranzasEfectivo: cobranzasEfectivoHoy, efectivoEsperado: Number(cajaDelDia.efectivoEsperado || 0), montoReal: Number(cajaDelDia.montoCierreReal || 0), diferencia: Number(cajaDelDia.diferenciaCierre || 0) }); setPrintMode("box-report"); }} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/10">
                <Printer size={16} />
                Imprimir reporte final
              </button>
            </div>
          ) : <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-sm text-slate-400">Todavia no se realizo el cierre de caja de hoy.</div>}
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="border-b border-slate-800 px-6 py-4"><h3 className="text-lg font-bold text-slate-100">Historial de operaciones</h3></div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Metodo</th>
                <th className="px-6 py-4">Articulos vendidos</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                ...ventas.map(v => ({ ...v, _tipo: 'venta' })),
                ...pagosCuotas.map(p => ({ ...p, _tipo: 'cobro' }))
              ]
                .slice()
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map((row) => {
                  if (row._tipo === 'cobro') {
                    return (
                      <tr key={`cobro-${row.id}`} className="align-top text-sm text-slate-400 bg-amber-500/5 border-l-2 border-l-amber-500/30">
                        <td className="px-6 py-4 font-medium text-slate-100">{new Date(row.fecha).toLocaleDateString('es-AR')} {new Date(row.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4 text-amber-200">{row.cliente_nombre || 'Sin nombre'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">Cobro CC</span>
                            <span className="text-slate-300">{row.metodo_pago || 'Efectivo'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic">Pago de cuenta corriente</td>
                        <td className="px-6 py-4 font-bold text-amber-300">{currency.format(Number(row.monto || 0))}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`venta-${row.id}`} className="align-top text-sm text-slate-400">
                      <td className="px-6 py-4 font-medium text-slate-100">{new Date(row.fecha).toLocaleDateString('es-AR')} {new Date(row.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4">{row.clienteNombre || 'Consumidor final'}</td>
                      <td className={`px-6 py-4 ${row.enCuentaCorriente ? 'text-amber-300' : 'text-slate-300'}`}>{row.metodoPago || '-'}</td>
                      <td className="px-6 py-4">{(row.articulos || []).map((item) => `${item.nombre} · ${item.talle || 'Unico'}`).join(' | ') || '-'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{currency.format(Number(row.total || 0))}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StatusBanners({ ultimaVenta, enviarWhatsApp, mensaje }) {
  return (
    <>
      {ultimaVenta ? <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-emerald-300">Ultima venta registrada</p><p className="mt-1 text-sm text-slate-200">{ultimaVenta.clienteNombre || "Consumidor final"} · {currency.format(ultimaVenta.total)}</p></div><button onClick={enviarWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-slate-950 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10"><MessageCircle size={18} />Enviar por WhatsApp</button></div></div> : null}
      {mensaje ? <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100">{mensaje}</div> : null}
    </>
  );
}
