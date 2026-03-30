import { useMemo } from "react";
import { Banknote, Camera, Check, ChevronLeft, Key, Lock, Printer, Search, ShoppingCart, Trash2, UserRound } from "lucide-react";
import { currency, payMethods, PIN_CODE, pinPadNumbers } from "../../utils/helpers";

export const CameraScanner = ({ cameraOpen, setCameraError, setCameraOpen, closeCameraScanner, cameraContainerId, cameraLoading, cameraError, lastDetectedCode }) => {
  if (!cameraOpen) return null;
  return (
    <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-inner shadow-black/30 w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">Escáner por cámara</p>
          <p className="mt-1 text-xs text-slate-400">Apunta al código de barras con la cámara trasera.</p>
        </div>
        <button onClick={closeCameraScanner} className="inline-flex items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3.5 text-sm font-bold text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/15">Cerrar cámara</button>
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-indigo-500 bg-black p-2 animate-pulse shadow-[0_0_0_1px_rgba(74,222,128,0.2),0_0_24px_rgba(74,222,128,0.18)]">
          <div className="rounded-[1.25rem] border border-indigo-500 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_55%),#000] p-2">
            <div id={cameraContainerId} className="min-h-[300px] w-full rounded-2xl flex items-center justify-center relative">
               <div className="absolute inset-x-8 inset-y-16 border-2 border-dashed border-emerald-400/60 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-300">
        Último código detectado: <span className="font-semibold text-emerald-300">{lastDetectedCode || "sin lecturas todavía"}</span>
      </div>
      {cameraLoading ? <p className="mt-3 text-xs text-slate-400">Solicitando permiso y preparando la cámara...</p> : null}
      {cameraError ? <p className="mt-3 text-xs text-rose-300">{cameraError}</p> : <p className="mt-3 text-xs font-medium text-emerald-300">Alinea la etiqueta dentro del marco brillante para una lectura más rápida.</p>}
    </div>
  );
};

export const SalesSidebar = ({ carrito, setCarrito, metodoPago, setMetodoPago, montoDescuento, setMontoDescuento, imprimirTicket, finalizar, clientes, anotarEnCuentaCorriente, setAnotarEnCuentaCorriente, clienteSeleccionadoId, setClienteSeleccionadoId, clienteVentaRapida, setClienteVentaRapida }) => {
  return (
    <div className="w-full xl:max-w-[380px] xl:shrink-0">
      <TicketPanel carrito={carrito} metodoPago={metodoPago} setMetodoPago={setMetodoPago} montoDescuento={montoDescuento} setMontoDescuento={setMontoDescuento} onQuitar={(id) => setCarrito((actual) => actual.filter((item) => item.idTemporal !== id))} onImprimir={imprimirTicket} onFinalizar={finalizar} clientes={clientes} anotarEnCuentaCorriente={anotarEnCuentaCorriente} setAnotarEnCuentaCorriente={setAnotarEnCuentaCorriente} clienteSeleccionadoId={clienteSeleccionadoId} setClienteSeleccionadoId={setClienteSeleccionadoId} clienteVentaRapida={clienteVentaRapida} setClienteVentaRapida={setClienteVentaRapida} />
    </div>
  );
};

export function Buscador({ value, onChange, placeholder }) {
  return (
    <label className="relative block">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15" />
    </label>
  );
}

export function Campo({ onChange, className = "", ...props }) {
  return <input {...props} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 ${className}`} />;
}

export function PinLoginScreen({ pin, onDigit, onBackspace, onClear, onSubmit, error, shake }) {
  const dots = Array.from({ length: PIN_CODE.length }, (_, index) => index < pin.length);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className={`w-full max-w-md rounded-4xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/30 ${shake ? "animate-[shake_0.35s_ease-in-out_2]" : ""}`}>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">Acceso privado</p>
            <h1 className="mt-4 text-4xl font-black tracking-[0.18em] text-slate-50">TIENDA NANCY</h1>
            <p className="mt-3 text-sm text-slate-400">Ingresa el PIN diario para abrir el sistema.</p>
          </div>
          <form onSubmit={onSubmit} className="mt-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex items-center justify-center gap-3">
                <Lock size={18} className="text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">PIN de acceso</span>
              </div>
              <div className="mt-5 flex justify-center gap-3">
                {dots.map((filled, index) => (
                  <span key={index} className={`h-4 w-4 rounded-full border ${filled ? "border-emerald-400 bg-emerald-400" : "border-slate-700 bg-slate-900"}`} />
                ))}
              </div>
            </div>
            {error ? <p className="mt-4 text-center text-sm font-medium text-red-500">{error}</p> : <p className="mt-4 text-center text-sm text-slate-500">El PIN queda protegido y la sesion dura hasta el cierre del dia.</p>}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {pinPadNumbers.map((digit) => (
                <button key={digit} type="button" onClick={() => onDigit(digit)} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-5 text-3xl font-black text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900">
                  {digit}
                </button>
              ))}
              <button type="button" onClick={onClear} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-slate-600 hover:bg-slate-900">
                Limpiar
              </button>
              <button type="button" onClick={() => onDigit("0")} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-2xl font-bold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900">
                0
              </button>
              <button type="button" onClick={onBackspace} className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-slate-200 transition hover:border-slate-600 hover:bg-slate-900">
                <ChevronLeft size={24} />
              </button>
            </div>
            <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-400">
              <Key size={18} />
              Ingresar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function CajaAperturaModal({ monto, onChange, onConfirm, onClose, title = "Apertura de Caja", description = "Ingresa el efectivo inicial disponible para cambio. Esta apertura queda registrada para la jornada actual." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-4xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400">Caja del dia</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-50">{title}</h2>
            <p className="mt-3 text-sm text-slate-400">{description}</p>
          </div>
          {onClose ? <button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700">Cerrar</button> : null}
        </div>
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
            <Banknote size={16} />
            Apertura obligatoria
          </div>
          <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Monto de inicio</label>
          <Campo type="number" value={monto} onChange={onChange} placeholder="0" min="0" className="mt-3" />
        </div>
        <button onClick={onConfirm} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-400">
          <Banknote size={18} />
          Abrir caja
        </button>
      </div>
    </div>
  );
}

export function CajaCierreModal({ apertura, ventasEfectivo, esperado, montoReal, onMontoRealChange, onConfirm, onClose }) {
  const diferencia = Number(montoReal || 0) - esperado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-4xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">Caja del dia</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-50">Realizar Cierre de Caja</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700">Cerrar</button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Apertura</p>
            <p className="mt-3 text-2xl font-bold text-emerald-300">{currency.format(apertura)}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Ventas en efectivo</p>
            <p className="mt-3 text-2xl font-bold text-slate-100">{currency.format(ventasEfectivo)}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Efectivo esperado</p>
            <p className="mt-3 text-2xl font-bold text-amber-300">{currency.format(esperado)}</p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Monto real en caja</label>
          <Campo type="number" value={montoReal} onChange={onMontoRealChange} placeholder="0" min="0" className="mt-3" />
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${diferencia === 0 ? "border-slate-700 bg-slate-900 text-slate-200" : diferencia > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
            {diferencia === 0 ? "Sin diferencia entre sistema y conteo fisico." : diferencia > 0 ? `Sobrante detectado: ${currency.format(diferencia)}.` : `Faltante detectado: ${currency.format(Math.abs(diferencia))}.`}
          </div>
        </div>
        <button onClick={onConfirm} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-rose-400">
          Confirmar cierre
        </button>
      </div>
    </div>
  );
}

export function TicketPanel({
  carrito,
  metodoPago,
  setMetodoPago,
  montoDescuento,
  setMontoDescuento,
  onQuitar,
  onImprimir,
  onFinalizar,
  clientes,
  anotarEnCuentaCorriente,
  setAnotarEnCuentaCorriente,
  clienteSeleccionadoId,
  setClienteSeleccionadoId,
  clienteVentaRapida,
  setClienteVentaRapida,
}) {
  const subtotal = useMemo(() => carrito.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 1)), 0), [carrito]);
  const descuento = Math.max(0, Math.min(Number(montoDescuento || 0), subtotal));
  const total = Math.max(0, subtotal - descuento);

  return (
    <aside className="sticky top-4 self-start">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-black/30">
        <div className="border-b border-slate-800 bg-slate-950/70 p-5"><div className="flex items-center gap-3"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-3"><ShoppingCart size={22} className="text-slate-100" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ticket de venta</p><h2 className="mt-1 text-2xl font-bold text-slate-100">Venta actual</h2></div></div></div>
        <div className="max-h-80 space-y-3 overflow-y-auto p-5">{carrito.length ? carrito.map((item) => <div key={item.idTemporal} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-start gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">{item.foto ? <img src={item.foto} alt={item.nombre} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-600"><Camera size={18} /></div>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-100">{item.nombre}</p><p className="mt-1 text-sm text-slate-400">{item.codigo || "Sin codigo"} · Talle {item.talle} · x{Number(item.cantidad || 1)}</p><p className="mt-3 text-sm font-bold text-emerald-400">{currency.format(Number(item.precio || 0) * Number(item.cantidad || 1))}</p></div><button onClick={() => onQuitar(item.idTemporal)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-rose-500 hover:bg-rose-500/15 hover:text-rose-300"><Trash2 size={14} />Borrar</button></div></div></div></div>) : <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">El carrito esta vacio.</div>}</div>
        <div className="border-t border-slate-800 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Metodo de pago</p>
          <div className="mt-3 grid grid-cols-2 gap-2">{payMethods.map((method) => <button key={method} onClick={() => setMetodoPago(method)} disabled={anotarEnCuentaCorriente} className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${metodoPago === method ? "border-indigo-500 bg-indigo-500/10 text-slate-100" : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"} ${anotarEnCuentaCorriente ? "cursor-not-allowed opacity-40" : ""}`}>{method}</button>)}</div>
          <div className="mt-4"><label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descuento manual ($)</label><Campo type="number" value={montoDescuento} onChange={setMontoDescuento} placeholder="0" min="0" step="100" className="mt-2" /></div>
          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"><input type="checkbox" checked={anotarEnCuentaCorriente} onChange={(event) => setAnotarEnCuentaCorriente(event.target.checked)} className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500" /><span className="text-sm font-semibold text-slate-100">Anotar en Cuenta Corriente</span></label>
          {anotarEnCuentaCorriente ? <div className="mt-4"><label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Cliente asociado</label><select value={clienteSeleccionadoId} onChange={(event) => setClienteSeleccionadoId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"><option value="">Seleccionar cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={String(cliente.id)}>{cliente.nombre} · {cliente.telefono || "Sin telefono"}</option>)}</select><p className="mt-2 text-xs text-amber-300">La venta se guardara como deuda y no como cobrada.</p></div> : (
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Envio WhatsApp (Opcional)</label>
              <input type="text" placeholder="Nombre (Opcional)" value={clienteVentaRapida.nombre} onChange={(e) => setClienteVentaRapida(prev => ({ ...prev, nombre: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
              <input type="text" placeholder="WhatsApp ej: 54911..." value={clienteVentaRapida.telefono} onChange={(e) => setClienteVentaRapida(prev => ({ ...prev, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
            </div>
          )}
          <div className="mt-5 space-y-3 border-t border-slate-800 pt-5"><div className="flex items-center justify-between text-sm font-semibold text-slate-400"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div><div className="flex items-center justify-between text-sm font-semibold text-rose-300"><span>Descuento</span><span>-{currency.format(descuento)}</span></div><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-300">Total</span><span className="text-3xl font-bold text-emerald-400">{currency.format(total)}</span></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={onImprimir} disabled={!carrito.length} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500/15 disabled:bg-slate-900 disabled:text-slate-500"><Printer size={18} />Imprimir ticket</button><button onClick={onFinalizar} disabled={!carrito.length} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-bold text-slate-100 transition hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500"><Check size={18} />Finalizar venta</button></div>
        </div>
      </div>
    </aside>
  );
}

export function SummaryCard({ title, value, accent = "text-slate-100", panelClass }) {
  return <div className={panelClass}><p className="text-sm font-semibold text-slate-400">{title}</p><p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p></div>;
}

