import Barcode from "react-barcode";
import { Tag } from "lucide-react";
import { currency, getBarcodeValue, talles } from "../../utils/helpers";

export const printStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    50% { transform: translateX(8px); }
    75% { transform: translateX(-5px); }
  }
  .print-only {
    display: none;
  }
  @media print {
    @page {
      size: 58mm auto;
      margin: 0;
    }
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .print-only-active {
      display: block !important;
    }
    .print-only-inactive {
      display: none !important;
    }
    #print-ticket {
      position: static !important;
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 8mm 6mm !important;
      background: #fff !important;
      color: #000 !important;
      font-family: "Courier New", monospace !important;
      font-size: 12px !important;
      line-height: 1.4 !important;
      box-shadow: none !important;
    }
    #print-ticket * {
      color: #000 !important;
      background: transparent !important;
    }
    #print-labels {
      width: 58mm !important;
      max-width: 58mm !important;
      margin: 0 !important;
      padding: 3mm !important;
      background: #fff !important;
      color: #000 !important;
      font-family: Arial, sans-serif !important;
    }
    #print-labels * {
      color: #000 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    #print-box-report {
      display: block !important;
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 8mm 6mm !important;
      background: #fff !important;
      color: #000 !important;
      font-family: "Courier New", monospace !important;
      font-size: 12px !important;
      line-height: 1.45 !important;
    }
    #print-box-report * {
      color: #000 !important;
      background: transparent !important;
    }
    .box-report__title {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
    }
    .box-report__subtitle {
      margin-bottom: 8px;
      text-align: center;
    }
    .box-report__divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .box-report__strong {
      font-weight: 700;
    }
    .barcode-label {
      width: 100%;
      border: 1px dashed #000;
      padding: 3mm 2mm;
      margin: 0 0 3mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .barcode-label:last-child {
      margin-bottom: 0;
    }
    .barcode-label__store {
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .barcode-label__name {
      margin-top: 2mm;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
    }
    .barcode-label__size {
      margin-top: 1mm;
      text-align: center;
      font-size: 11px;
    }
    .barcode-label__barcode {
      display: flex;
      justify-content: center;
      margin-top: 2mm;
    }
    .barcode-label__barcode svg {
      max-width: 100%;
      height: auto;
    }
    .barcode-label__price {
      margin-top: 2mm;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
    }
    .print-hidden {
      display: none !important;
    }
  }
`;

export function PrintableTicket({ carrito, descuento, metodoPago, total, clienteNombre, enCuentaCorriente }) {
  return (
    <section id="print-ticket" aria-hidden="true">
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>Tienda Nancy</div>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>Ticket de venta</div>
      <div>Fecha: {new Date().toLocaleString("es-AR")}</div>
      <div>Cliente: {clienteNombre || "Consumidor final"}</div>
      <div style={{ marginTop: "8px", borderTop: "1px dashed #000", paddingTop: "8px" }}>
        {carrito.map((item) => (
          <div key={item.idTemporal} style={{ marginBottom: "8px" }}>
            <div>{item.nombre}</div>
            <div>Talle: {item.talle}</div>
            <div>Cantidad: {Number(item.cantidad || 1)}</div>
            <div>{currency.format(Number(item.precio || 0) * Number(item.cantidad || 1))}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px dashed #000", paddingTop: "8px" }}>
        <div>Descuento: {currency.format(descuento)}</div>
        <div>Metodo de pago: {enCuentaCorriente ? "Cuenta Corriente" : metodoPago}</div>
        <div style={{ fontWeight: "bold", marginTop: "6px" }}>Total: {currency.format(total)}</div>
      </div>
    </section>
  );
}

export function LabelPrintDialog({ producto, onClose, onPrintSize, onPrintAll }) {
  if (!producto) return null;
  const opciones = talles(producto.talles);
  const tallesDisponibles = opciones.length ? opciones : ["Unico"];
  const barcodeValue = getBarcodeValue(producto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Etiquetas</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-100">{producto.nombre}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Codigo: {barcodeValue || "Sin codigo"} · Precio: {currency.format(Number(producto.precio || 0))}
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700">
            Cerrar
          </button>
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-slate-200">Elegi el talle a imprimir</p>
          <div className="flex flex-wrap gap-2">
            {tallesDisponibles.map((talle) => (
              <button
                key={`${producto.id}-${talle}`}
                onClick={() => onPrintSize(producto, talle)}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-200"
              >
                {talle}
              </button>
            ))}
          </div>
          {tallesDisponibles.length > 1 ? (
            <button onClick={() => onPrintAll(producto)} className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/15">
              <Tag size={16} />
              Imprimir tira completa
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PrintableLabels({ labels }) {
  return (
    <section id="print-labels" aria-hidden="true">
      {labels.map((label, index) => (
        <article key={`${label.barcodeValue}-${label.talle}-${index}`} className="barcode-label">
          <div className="barcode-label__store">TIENDA NANCY</div>
          <div className="barcode-label__name">{label.nombre}</div>
          <div className="barcode-label__size">Talle: {label.talle}</div>
          <div className="barcode-label__barcode">
            <Barcode
              value={label.barcodeValue}
              format="CODE128"
              width={1.3}
              height={42}
              margin={0}
              fontSize={12}
              displayValue
              background="transparent"
            />
          </div>
          <div className="barcode-label__price">{currency.format(Number(label.precio || 0))}</div>
        </article>
      ))}
    </section>
  );
}

export function PrintableBoxReport({ report }) {
  if (!report) return null;

  return (
    <section id="print-box-report" aria-hidden="true">
      <div className="box-report__title">TIENDA NANCY</div>
      <div className="box-report__subtitle">Cierre de Caja</div>
      <div>Fecha: {new Date(report.fechaCierre || Date.now()).toLocaleString("es-AR")}</div>
      <div>Jornada: {report.fechaClave}</div>
      <div className="box-report__divider" />
      <div>Inicio: {currency.format(report.montoApertura)}</div>
      <div>Ventas efectivo: {currency.format(report.ventasEfectivo)}</div>
      <div>Total a rendir: {currency.format(report.efectivoEsperado)}</div>
      <div>Efectivo contado: {currency.format(report.montoReal)}</div>
      <div className="box-report__divider" />
      <div className="box-report__strong">
        {report.diferencia === 0 ? "Sin diferencia" : report.diferencia > 0 ? `Sobrante: ${currency.format(report.diferencia)}` : `Faltante: ${currency.format(Math.abs(report.diferencia))}`}
      </div>
    </section>
  );
}
