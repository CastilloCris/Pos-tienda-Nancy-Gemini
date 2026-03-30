export const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const panel = "rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20";
export const payMethods = ["Efectivo", "Transferencia", "Debito", "Credito"];
export const talles = (text = "") => text.split(",").map((item) => item.trim()).filter(Boolean);
export const normalize = (text = "") => text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
export const getBarcodeValue = (producto) => String(producto?.codigo || producto?.sku || producto?.codigoBarra || producto?.barcode || producto?.id || "").trim();
export const AUTH_STORAGE_KEY = "tienda-nancy-auth";
export const PIN_CODE = "159357";
export const pinPadNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const generateEANLikeCode = (sequence = null) => {
  const randomSuffix = sequence !== null ? String(sequence).padStart(3, "0") : Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return "779" + String(Date.now()).slice(-6) + randomSuffix;
};

export const getEndOfDayTimestamp = () => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime();
};

export const isSameDay = (isoDate, dateKey) => String(isoDate || "").slice(0, 10) === dateKey;

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export async function compressImage(file) {
  if (!file) return "";
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export const download = (name, text, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const csv = (ventas) =>
  [["Fecha", "Hora", "Metodo", "Cliente", "Cuenta Corriente", "Descuento", "Articulos", "Total"], ...ventas.map((venta) => {
    const fecha = new Date(venta.fecha);
    return [
      fecha.toLocaleDateString("es-AR"),
      fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      venta.metodoPago || "-",
      venta.clienteNombre || "-",
      venta.enCuentaCorriente ? "Si" : "No",
      Number(venta.montoDescuento || 0).toFixed(2),
      (venta.articulos || []).map((item) => `${item.nombre} (${item.talle || "Unico"})`).join(" | "),
      Number(venta.total || 0).toFixed(2),
    ];
  })].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
