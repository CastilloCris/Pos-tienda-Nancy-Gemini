import { Camera, Pencil, Tag, Trash2 } from "lucide-react";
import { currency } from "../../utils/helpers";

export function InventarioTable({ productos, onEditar, onEliminar, onEtiqueta }) {
  return (
    <div className="mt-4 w-full overflow-x-auto rounded-2xl border border-slate-800">
      <table className="min-w-[860px] w-full divide-y divide-slate-800">
        <thead className="bg-slate-950">
          <tr className="text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-4 py-3 w-16">Foto</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Detalles</th>
            <th className="px-4 py-3">Talles</th>
            <th className="px-4 py-3 text-center">Stock</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900">
          {productos.map((producto) => {
            const stockBajo = Number(producto.stock || 0) < Number(producto.stock_minimo ?? 3);
            return (
              <tr key={producto.id} className="group text-sm text-slate-400 transition-colors hover:bg-slate-800/50">

                {/* Foto */}
                <td className="px-4 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shrink-0">
                    {producto.foto
                      ? <img src={producto.foto} alt={producto.nombre} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-slate-700"><Camera size={14} /></div>
                    }
                  </div>
                </td>

                {/* Nombre — columna principal, bien visible */}
                <td className="px-4 py-3 max-w-[180px]">
                  <p className="text-sm font-semibold text-slate-100 leading-snug">{producto.nombre}</p>
                </td>

                {/* Código */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">{producto.codigo || <span className="text-slate-600">—</span>}</span>
                </td>

                {/* Categoría */}
                <td className="px-4 py-3">
                  {producto.categoria
                    ? <span className="inline-block rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">{producto.categoria}</span>
                    : <span className="text-slate-600">—</span>
                  }
                </td>

                {/* Detalles */}
                <td className="px-4 py-3 text-slate-400 text-xs">{producto.detalles || <span className="text-slate-600">—</span>}</td>

                {/* Talles */}
                <td className="px-4 py-3 text-xs text-slate-400">{producto.talles || <span className="text-slate-600">—</span>}</td>

                {/* Stock */}
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center min-w-8 rounded-lg px-2 py-1 text-sm font-bold border ${
                    stockBajo
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      : "bg-slate-800 text-slate-200 border-slate-700"
                  }`}>
                    {producto.stock ?? 0}
                  </span>
                </td>

                {/* Precio — vital para Nancy, color destacado */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                    {currency.format(Number(producto.precio || 0))}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEtiqueta(producto)}
                      title="Imprimir etiqueta"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-500 hover:bg-amber-500/10"
                    >
                      <Tag size={13} />Etiqueta
                    </button>
                    <button
                      onClick={() => onEditar(producto)}
                      title="Editar producto"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-blue-300 transition hover:border-blue-500 hover:bg-blue-500/15"
                    >
                      <Pencil size={13} />Editar
                    </button>
                    <button
                      onClick={() => onEliminar(producto)}
                      title="Eliminar producto"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/15"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>

              </tr>
            );
          })}
          {!productos.length && (
            <tr>
              <td colSpan="9" className="px-4 py-10 text-center text-sm text-slate-500">
                No hay productos que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ClientesTable({ clientes, pagos, setPagos, onRegistrarPago, onEditar, deleteCliente }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[860px] divide-y divide-slate-800">
        <thead className="bg-slate-950 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-4">Cliente</th>
            <th className="px-4 py-4">Telefono</th>
            <th className="px-4 py-4">DNI</th>
            <th className="px-4 py-4 text-right">Deuda</th>
            <th className="px-4 py-4 text-right">Registrar cobro</th>
            <th className="px-4 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900">
          {clientes.map((cliente) => {
            const datosPago = pagos[cliente.id] || {};
            const montoVal = typeof datosPago === "object" ? (datosPago.monto ?? "") : datosPago;
            const metodoVal = typeof datosPago === "object" ? (datosPago.metodoPago ?? "Efectivo") : "Efectivo";

            const setMonto = (val) =>
              setPagos((actual) => ({ ...actual, [cliente.id]: { monto: val, metodoPago: metodoVal } }));
            const setMetodo = (val) =>
              setPagos((actual) => ({ ...actual, [cliente.id]: { monto: montoVal, metodoPago: val } }));

            return (
              <tr key={cliente.id} className="text-sm text-slate-300">
                <td className="px-4 py-4"><button onClick={() => onEditar(cliente)} className="font-semibold text-slate-100 hover:text-indigo-300">{cliente.nombre}</button></td>
                <td className="px-4 py-4">{cliente.telefono || "-"}</td>
                <td className="px-4 py-4">{cliente.dni || "-"}</td>
                <td className={`px-4 py-4 text-right font-bold ${Number(cliente.deuda || 0) > 0 ? "text-amber-300" : "text-emerald-400"}`}>{currency.format(Number(cliente.deuda || 0))}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {/* Selector de método */}
                    <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold">
                      {["Efectivo", "Transferencia"].map((metodo) => (
                        <button
                          key={metodo}
                          type="button"
                          onClick={() => setMetodo(metodo)}
                          className={`px-3 py-2 transition ${
                            metodoVal === metodo
                              ? metodo === "Efectivo"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-indigo-500/20 text-indigo-300"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {metodo}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={montoVal}
                      onChange={(event) => setMonto(event.target.value)}
                      placeholder="Monto"
                      className="w-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-right text-sm text-slate-100 outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => onRegistrarPago(cliente)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-500/10"
                    >
                      Registrar cobro
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEditar(cliente)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-500 hover:bg-blue-500/15"><Pencil size={16} />Editar</button>
                    <button onClick={() => deleteCliente(cliente)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/15"><Trash2 size={16} />Eliminar</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!clientes.length ? <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-400">No hay clientes cargados.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

