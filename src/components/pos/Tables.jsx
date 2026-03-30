import { Camera, Pencil, Tag, Trash2 } from "lucide-react";
import { currency } from "../../utils/helpers";

export function InventarioTable({ productos, onEditar, onEliminar, onEtiqueta }) {
  return (
    <div className="mt-6 w-full overflow-x-auto">
      <table className="block min-w-[920px] divide-y divide-slate-800 md:table md:min-w-full">
        <thead className="bg-slate-950 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-4">Foto</th>
            <th className="px-4 py-4">Codigo</th>
            <th className="px-4 py-4">Nombre</th>
            <th className="px-4 py-4">Categoria</th>
            <th className="px-4 py-4 text-center">Stock</th>
            <th className="px-4 py-4">Detalles</th>
            <th className="px-4 py-4">Talles</th>
            <th className="px-4 py-4 text-right">Precio</th>
            <th className="px-4 py-4 text-right">Etiqueta</th>
            <th className="px-4 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900">
          {productos.map((producto) => (
            <tr key={producto.id} className="text-sm text-slate-400 transition hover:bg-slate-800/80">
              <td className="px-4 py-4">
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  {producto.foto ? <img src={producto.foto} alt={producto.nombre} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-600"><Camera size={16} /></div>}
                </div>
              </td>
              <td className="px-4 py-4 font-medium text-slate-300">{producto.codigo || "-"}</td>
              <td className="px-4 py-4 font-semibold text-slate-100">{producto.nombre}</td>
              <td className="px-4 py-4">{producto.categoria || "-"}</td>
              <td className="px-4 py-4 text-center">
                <span className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${Number(producto.stock || 0) < Number(producto.stock_minimo ?? 3) ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>
                  {producto.stock || 0}
                </span>
              </td>
              <td className="px-4 py-4">{producto.detalles || "-"}</td>
              <td className="px-4 py-4">{producto.talles || "-"}</td>
              <td className="px-4 py-4 text-right font-semibold text-emerald-400">{currency.format(Number(producto.precio || 0))}</td>
              <td className="px-4 py-4">
                <div className="flex justify-end">
                  <button onClick={() => onEtiqueta(producto)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-500 hover:bg-amber-500/10">
                    <Tag size={14} />
                    Etiqueta
                  </button>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEditar(producto)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-500 hover:bg-blue-500/15"><Pencil size={16} />Editar</button>
                  <button onClick={() => onEliminar(producto)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/15"><Trash2 size={16} />Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
          {!productos.length ? <tr><td colSpan="9" className="px-4 py-8 text-center text-sm text-slate-400">No hay productos que coincidan con la busqueda.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export function ClientesTable({ clientes, pagos, setPagos, onRegistrarPago, onEditar, deleteCliente }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[800px] divide-y divide-slate-800">
        <thead className="bg-slate-950 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-4">Cliente</th>
            <th className="px-4 py-4">Telefono</th>
            <th className="px-4 py-4">DNI</th>
            <th className="px-4 py-4 text-right">Deuda</th>
            <th className="px-4 py-4 text-right">Registrar pago</th>
            <th className="px-4 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900">
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="text-sm text-slate-300">
              <td className="px-4 py-4"><button onClick={() => onEditar(cliente)} className="font-semibold text-slate-100 hover:text-indigo-300">{cliente.nombre}</button></td>
              <td className="px-4 py-4">{cliente.telefono || "-"}</td>
              <td className="px-4 py-4">{cliente.dni || "-"}</td>
              <td className={`px-4 py-4 text-right font-bold ${Number(cliente.deuda || 0) > 0 ? "text-amber-300" : "text-emerald-400"}`}>{currency.format(Number(cliente.deuda || 0))}</td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <input type="number" min="0" value={pagos[cliente.id] || ""} onChange={(event) => setPagos((actual) => ({ ...actual, [cliente.id]: event.target.value }))} placeholder="Monto" className="w-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-right text-sm text-slate-100 outline-none focus:border-indigo-500" />
                  <button onClick={() => onRegistrarPago(cliente)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-500/10">Registrar pago</button>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEditar(cliente)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-500 hover:bg-blue-500/15"><Pencil size={16} />Editar</button>
                  <button onClick={() => deleteCliente(cliente)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/15"><Trash2 size={16} />Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
          {!clientes.length ? <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-400">No hay clientes cargados.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
