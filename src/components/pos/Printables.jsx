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

  /* ─── Página por defecto: tickets 80mm ─────────────────── */
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }

    /* Etiquetas térmicas: página fija 50x25mm con corte por etiqueta */
    @page label-page {
      size: 50mm 25mm;
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

    /* ─────────────── TICKET DE VENTA ─────────────── */
    #print-ticket {
      position: static !important;
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 4mm 3mm 6mm !important;
      background: #fff !important;
      color: #000 !important;
      font-family: "Courier New", Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.45 !important;
      box-shadow: none !important;
      /* Sin saltos de página forzados: el papel continúa hasta el final */
      page-break-inside: avoid;
      break-inside: avoid;
    }
    #print-ticket * {
      color: #000 !important;
      background: transparent !important;
    }
    .ticket__header {
      text-align: center;
      margin-bottom: 3mm;
    }
    .ticket__store-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .ticket__subtitle {
      font-size: 11px;
      margin-top: 1mm;
    }
    .ticket__meta {
      font-size: 10px;
      margin-bottom: 2mm;
    }
    .ticket__divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 2.5mm 0;
    }
    .ticket__items-table {
      width: 100%;
      border-collapse: collapse;
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
    }
    .ticket__items-table th {
      text-align: left;
      font-weight: 700;
      padding-bottom: 1.5mm;
      border-bottom: 1px solid #000;
    }
    .ticket__items-table th.col-price,
    .ticket__items-table td.col-price {
      text-align: right;
    }
    .ticket__items-table th.col-qty,
    .ticket__items-table td.col-qty {
      text-align: center;
      width: 6mm;
    }
    .ticket__items-table td {
      padding: 1mm 0;
      vertical-align: top;
    }
    .ticket__item-name {
      font-size: 10px;
    }
    .ticket__item-sub {
      font-size: 9px;
      opacity: 0.75;
    }
    .ticket__totals {
      margin-top: 1.5mm;
    }
    .ticket__totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 0.5mm 0;
    }
    .ticket__totals-row--bold {
      font-weight: 800;
      font-size: 12px;
      margin-top: 1mm;
    }
    .ticket__footer {
      text-align: center;
      font-size: 9px;
      margin-top: 4mm;
      opacity: 0.7;
    }

    /* ─────────────── ETIQUETAS TÉRMICAS ─────────────── */
    #print-labels {
      width: 50mm !important;
      max-width: 50mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      font-family: Arial, sans-serif !important;
    }
    #print-labels * {
      color: #000 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .barcode-label {
      /* Cada etiqueta ocupa exactamente su página: 50x25mm */
      page: label-page;
      width: 50mm;
      height: 25mm;
      box-sizing: border-box;
      padding: 1mm 1.5mm;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      /* Corte después de cada etiqueta */
      break-after: page;
      page-break-after: always;
    }
    .barcode-label:last-child {
      /* No forzar corte innecesario al final */
      break-after: avoid;
      page-break-after: avoid;
    }
    .barcode-label__name {
      text-align: center;
      font-size: 7pt;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      margin-bottom: 0.3mm;
    }
    .barcode-label__barcode {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
    }
    .barcode-label__barcode svg {
      display: block;
      max-width: 46mm;
      height: auto;
      image-rendering: crisp-edges;
      shape-rendering: crispEdges;
    }
    .barcode-label__sku {
      text-align: center;
      font-size: 6pt;
      letter-spacing: 0.04em;
      margin-top: 0.3mm;
      font-family: "Courier New", monospace;
    }
    .print-hidden {
      display: none !important;
    }

    /* ─────────────── CIERRE DE CAJA (80mm) ─────────────── */
    #print-box-report {
      display: block !important;
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 4mm 3mm 6mm !important;
      background: #fff !important;
      color: #000 !important;
      font-family: "Courier New", Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
      /* Sin saltos forzados: auto-corte al final */
      page-break-inside: avoid;
      break-inside: avoid;
    }
    #print-box-report * {
      color: #000 !important;
      background: transparent !important;
    }
    .box-report__title {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .box-report__subtitle {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      margin-top: 1mm;
      margin-bottom: 1mm;
    }
    .box-report__date {
      text-align: center;
      font-size: 10px;
      margin-bottom: 0.5mm;
    }
    .box-report__divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 2.5mm 0;
    }
    .box-report__strong {
      font-weight: 700;
    }
    .box-report__row {
      display: flex;
      justify-content: space-between;
      gap: 2px;
      padding: 0.8mm 0;
    }
    .box-report__label {
      flex: 1;
    }
    .box-report__value {
      text-align: right;
      white-space: nowrap;
    }
    .box-report__indent {
      padding-left: 5px;
      font-size: 10px;
      opacity: 0.9;
    }
    .box-report__section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1mm;
      opacity: 0.7;
    }
    .box-report__total-row {
      display: flex;
      justify-content: space-between;
      gap: 2px;
      font-size: 13px;
      font-weight: 800;
      padding: 1mm 0;
    }
    .box-report__result {
      text-align: center;
      font-weight: 700;
      font-size: 12px;
      padding: 1.5mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin: 2mm 0 0;
    }
    .box-report__footer {
      text-align: center;
      font-size: 9px;
      margin-top: 4mm;
      opacity: 0.65;
    }
  }
`;

export function PrintableTicket({ carrito, descuento, metodoPago, total, clienteNombre, enCuentaCorriente }) {
  const subtotal = carrito.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 1)), 0);

  return (
    <section id="print-ticket" aria-hidden="true">
      {/* Cabecera centrada */}
      <div className="ticket__header">
        <div className="ticket__store-name">Tienda Nancy</div>
        <div className="ticket__subtitle">Ticket de Venta</div>
      </div>

      <hr className="ticket__divider" />

      {/* Datos de la operación */}
      <div className="ticket__meta">
        <div>Fecha: {new Date().toLocaleString("es-AR")}</div>
        <div>Cliente: {clienteNombre || "Consumidor final"}</div>
        <div>Pago: {enCuentaCorriente ? "Cuenta Corriente" : metodoPago}</div>
      </div>

      <hr className="ticket__divider" />

      {/* Tabla de ítems con columnas alineadas */}
      <table className="ticket__items-table">
        <thead>
          <tr>
            <th className="col-qty">Cant</th>
            <th>Descripción</th>
            <th className="col-price">Precio</th>
          </tr>
        </thead>
        <tbody>
          {carrito.map((item) => (
            <tr key={item.idTemporal}>
              <td className="col-qty">{Number(item.cantidad || 1)}</td>
              <td>
                <div className="ticket__item-name">{item.nombre}</div>
                {item.talle && item.talle !== "Unico" && (
                  <div className="ticket__item-sub">Talle: {item.talle}</div>
                )}
              </td>
              <td className="col-price">
                {currency.format(Number(item.precio || 0) * Number(item.cantidad || 1))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="ticket__divider" />

      {/* Totales */}
      <div className="ticket__totals">
        <div className="ticket__totals-row">
          <span>Subtotal</span>
          <span>{currency.format(subtotal)}</span>
        </div>
        {descuento > 0 && (
          <div className="ticket__totals-row">
            <span>Descuento</span>
            <span>- {currency.format(descuento)}</span>
          </div>
        )}
        <div className="ticket__totals-row ticket__totals-row--bold">
          <span>TOTAL</span>
          <span>{currency.format(total)}</span>
        </div>
      </div>

      <div className="ticket__footer">¡Gracias por tu compra!</div>
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
          <div className="barcode-label__name">
            {label.nombre}{label.talle && label.talle !== "Unico" ? ` · T.${label.talle}` : ""}
          </div>
          <div className="barcode-label__barcode">
            <Barcode
              value={label.barcodeValue || "0"}
              format="CODE128"
              width={1.2}
              height={38}
              margin={0}
              displayValue={false}
              background="transparent"
              lineColor="#000000"
            />
          </div>
          <div className="barcode-label__sku">{label.barcodeValue}</div>
        </article>
      ))}
    </section>
  );
}

export function PrintableBoxReport({ report }) {
  if (!report) return null;

  const cobranzas = Number(report.cobranzasEfectivo || 0);
  const ventasTransf = Number(report.ventasOtrosMedios || 0);

  return (
    <section id="print-box-report" aria-hidden="true">
      {/* Cabecera centrada */}
      <div className="box-report__title">TIENDA NANCY</div>
      <div className="box-report__subtitle">Cierre de Caja</div>
      <div className="box-report__date">
        Fecha: {new Date(report.fechaCierre || Date.now()).toLocaleString("es-AR")}
      </div>
      <div className="box-report__date">Jornada: {report.fechaClave}</div>

      <hr className="box-report__divider" />

      {/* Fondo inicial */}
      <div className="box-report__row">
        <span className="box-report__label">Fondo inicial:</span>
        <span className="box-report__value">{currency.format(report.montoApertura)}</span>
      </div>

      <hr className="box-report__divider" />

      {/* Ingresos desglosados */}
      <div className="box-report__section-title">Ingresos del día</div>

      <div className="box-report__row">
        <span className="box-report__label">Ventas efectivo:</span>
        <span className="box-report__value">{currency.format(report.ventasEfectivo)}</span>
      </div>

      {ventasTransf > 0 && (
        <div className="box-report__row box-report__indent">
          <span className="box-report__label">+ Ventas transferencia:</span>
          <span className="box-report__value">{currency.format(ventasTransf)}</span>
        </div>
      )}

      {cobranzas > 0 && (
        <div className="box-report__row">
          <span className="box-report__label">Cobro de Deudas:</span>
          <span className="box-report__value">{currency.format(cobranzas)}</span>
        </div>
      )}

      <hr className="box-report__divider" />

      {/* Total a rendir */}
      <div className="box-report__total-row">
        <span>Total a rendir:</span>
        <span>{currency.format(report.efectivoEsperado)}</span>
      </div>

      <div className="box-report__row">
        <span className="box-report__label">Efectivo contado:</span>
        <span className="box-report__value">{currency.format(report.montoReal)}</span>
      </div>

      {/* Resultado */}
      <div className="box-report__result">
        {report.diferencia === 0
          ? "✓ Sin diferencia"
          : report.diferencia > 0
          ? `▲ Sobrante: ${currency.format(report.diferencia)}`
          : `▼ Faltante: ${currency.format(Math.abs(report.diferencia))}`}
      </div>

      <div className="box-report__footer">Tienda Nancy · Sistema POS</div>
    </section>
  );
}
