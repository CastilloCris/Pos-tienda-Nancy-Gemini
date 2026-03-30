import { Camera } from "lucide-react";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const panel = "rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20";
const talles = (text = "") => text.split(",").map((item) => item.trim()).filter(Boolean);

function ProductCard({ producto, onAdd }) {
  const opciones = talles(producto.talles);
  return (
    <article className={`${panel} overflow-hidden p-0 flex flex-row h-full items-stretch`}>
      <div className="flex shrink-0 w-28 sm:w-36 items-center justify-center bg-slate-950 overflow-hidden">
        {producto.foto ? (
          <img src={producto.foto} alt={producto.nombre} className="h-full w-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100" loading="lazy" />
        ) : (
          <Camera className="h-8 w-8 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:text-indigo-400" />
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 min-w-0 justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-100 group-hover:text-indigo-300 transition-colors text-[13px] leading-tight" title={producto.nombre}>
              {producto.nombre}
            </h3>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 capitalize">
              {producto.categoria || "Sin categoria"}
              {producto.detalles ? ` • ${producto.detalles}` : ""}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Talles: {producto.talles || "Unico"}</p>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end">
            <span className="text-sm font-black tracking-tight text-emerald-400">{currency.format(producto.precio)}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(opciones.length ? opciones : ["Unico"]).map((talleItem) => (
              <button 
                key={`${producto.id}-${talleItem}`} 
                onClick={() => onAdd(producto, talleItem)} 
                disabled={Number(producto.stock || 0) <= 0}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-100 transition hover:border-indigo-500 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:bg-slate-800"
              >
                <span>+</span> {talleItem}
              </button>
            ))}
          </div>
          <div className="text-[11px] font-semibold">
            {Number(producto.stock || 0) <= 0 ? (
              <span className="text-rose-400">Sin stock</span>
            ) : Number(producto.stock || 0) < Number(producto.stock_minimo ?? 3) ? (
              <span className="text-amber-400">Stock: {producto.stock}</span>
            ) : (
              <span className="text-emerald-400">Stock: {producto.stock}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
