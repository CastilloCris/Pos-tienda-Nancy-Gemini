import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { clearCommercialHistory, crearProducto, db, enqueueSyncAction, exportBackupData, importBackupData, registrarVenta, sanitizeInt, seedClientesDemo } from "./db";
import Header from "./components/Header";
import { CajaAperturaModal, CajaCierreModal } from "./components/pos/Controls";
import { LabelPrintDialog, PrintableBoxReport, PrintableLabels, PrintableTicket, printStyles } from "./components/pos/Printables";
import { ClientsSection, InventorySection, SalesSection, StatusBanners, SummarySection } from "./components/pos/Sections";
import { DashboardSection } from "./components/pos/DashboardSection";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";
import { usePrintManager } from "./hooks/usePrintManager";
import { PWABanners } from "./components/PWABanners";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./contexts/AuthContext";
import { buscarProductos } from "./db";
import { supabase } from "./lib/supabaseClient";
import { syncProductsNow } from "./services/productSync";
import { syncClientsNow } from "./services/clientSync";
import { syncSalesNow } from "./services/salesSync";
import { syncBoxesNow } from "./services/boxSync";
import { repairSyncMetadata } from "./services/syncRepair";
import {
  compressImage,
  currency,
  download,
  generateEANLikeCode,
  getBarcodeValue,
  getTodayKey,
  isSameDay,
  normalize,
  talles,
} from "./utils/helpers";

const AUTO_SYNC_MODE = "sales-only";

export default function App() {
  const [tab, setTab] = useState("ventas");
  const [busqueda, setBusqueda] = useState("");
  const [scannerCodigo, setScannerCodigo] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [montoDescuento, setMontoDescuento] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [toastMensaje, setToastMensaje] = useState("");
  const [form, setForm] = useState({ 
    codigo: "", 
    nombre: "", 
    precio: "", 
    categoria: "", 
    talles: "", 
    foto: "", 
    detalles: "", 
    stock: "0", 
    stock_minimo: "3" 
  });
  const [editando, setEditando] = useState(null);
  const [clienteForm, setClienteForm] = useState({ nombre: "", telefono: "", dni: "", email: "" });
  const [clienteEditando, setClienteEditando] = useState(null);
  const [pagosClientes, setPagosClientes] = useState({});
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
  const [clienteVentaRapida, setClienteVentaRapida] = useState({ nombre: "", telefono: "", dni: "" });
  const [anotarEnCuentaCorriente, setAnotarEnCuentaCorriente] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [navState, setNavState] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [lastDetectedCode, setLastDetectedCode] = useState("");
  const [productoEtiqueta, setProductoEtiqueta] = useState(null);
  const [montoApertura, setMontoApertura] = useState("");
  const [cierreCajaOpen, setCierreCajaOpen] = useState(false);
  const [aperturaCajaOpen, setAperturaCajaOpen] = useState(false);
  const [montoRealCaja, setMontoRealCaja] = useState("");
  const [syncStatus, setSyncStatus] = useState({
    status: "idle", // 'idle', 'syncing', 'error', 'success'
    lastSync: null,
    errorSource: null, // 'auth', 'clientes', 'productos', 'ventas'
    errorMessage: "",
  });

  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);
  const scannerRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const syncInFlightRef = useRef(false);
  const startupSyncStartedRef = useRef(false);
  const authErrorRef = useRef(false); // Ref para evitar stale closure en runAutoSync

  // ── Auth: reemplaza al PIN local. Supabase maneja la sesión. ──────────────
  const { user, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = !!user;
  const ownerUserId = user?.id ?? null;

  const handleLogout = () => signOut();

  const withTimeout = (promise, label, ms = 20000) =>
    new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} superó ${Math.round(ms / 1000)}s sin responder.`));
      }, ms);

      Promise.resolve(promise)
        .then((value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          window.clearTimeout(timeoutId);
          reject(error);
        });
    });

  const runAutoSync = async () => {
    if (AUTO_SYNC_MODE === "off") return;

    // 🛑 Usamos ref (no state) para evitar stale closure y bloquear sync si auth falló
    if (authErrorRef.current) {
      console.warn("[App] Auto-sync bloqueado: fallo de autenticación previo. Recargá la página.");
      return;
    }

    // Guarda de concurrencia y conexión
    if (!isAuthenticated || !navigator.onLine || syncStatus.status === "syncing") {
      console.log(`[App] runAutoSync cancelado: auth=${isAuthenticated} online=${navigator.onLine} status=${syncStatus.status}`);
      return;
    }

    console.log("[App] 🚀 runAutoSync iniciando...");

    setSyncStatus((current) => ({
      ...current,
      status: "syncing",
      errorMessage: "",
      errorSource: null
    }));

    try {
      // Paso 1: Validar identidad — usamos ownerUserId del contexto React (ya autenticado)
      // NO llamamos getSession() de nuevo para evitar el cuelgue de red adicional
      console.log("🔗 [runAutoSync] URL Destino:", import.meta.env.VITE_SUPABASE_URL);
      console.log("👤 [runAutoSync] ownerUserId:", ownerUserId);

      if (!ownerUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerUserId)) {
        const err = new Error(`Identidad no válida en contexto React: ${ownerUserId || "Sin ID"}`);
        err.phase = "auth";
        throw err;
      }

      // Paso 2: Cajas — NO bloqueante (fallo no impide productos/ventas)
      try {
        const boxesRes = await withTimeout(syncBoxesNow(ownerUserId), "Sync Cajas", 20000);
        console.log("[runAutoSync] Cajas:", boxesRes.success ? "✅ OK" : "⚠️ FAIL", boxesRes.error ?? "");
      } catch (e) {
        console.warn("[runAutoSync] Cajas falló (no bloqueante):", e.message);
      }

      // Paso 3: Clientes — NO bloqueante
      try {
        const clientsRes = await withTimeout(syncClientsNow(ownerUserId), "Sync Clientes", 20000);
        console.log("[runAutoSync] Clientes:", clientsRes.success ? "✅ OK" : "⚠️ FAIL", clientsRes.error ?? "");
      } catch (e) {
        console.warn("[runAutoSync] Clientes falló (no bloqueante):", e.message);
      }

      // Paso 4: Productos — NO bloqueante (pull siempre intentado)
      let productsOk = false;
      try {
        const productsRes = await withTimeout(syncProductsNow(ownerUserId), "Sync Productos", 25000);
        productsOk = productsRes.success;
        console.log("[runAutoSync] Productos:", productsRes.success ? "✅ OK" : "⚠️ FAIL", productsRes.error ?? "");
      } catch (e) {
        console.warn("[runAutoSync] Productos falló (no bloqueante):", e.message);
      }

      // Paso 5: Ventas — siempre se intenta
      let salesRes = { success: false, pushed: 0 };
      try {
        salesRes = await withTimeout(syncSalesNow(ownerUserId, false), "Sync Ventas", 25000);
        console.log("[runAutoSync] Ventas:", salesRes.success ? "✅ OK" : "⚠️ FAIL", salesRes.error ?? "");
      } catch (e) {
        console.warn("[runAutoSync] Ventas falló:", e.message);
      }

      // Estado final
      setSyncStatus({
        status: "success",
        lastSync: new Date().toISOString(),
        errorSource: null,
        errorMessage: "",
      });

      if (salesRes.pushed > 0 || (salesRes.pulled ?? 0) > 0) {
        const msg = salesRes.pushed > 0
          ? `Se sincronizaron ${salesRes.pushed} ventas pendientes.`
          : `Se integraron ${salesRes.pulled} ventas nuevas de la nube.`;
        setToastMensaje(msg);
        setTimeout(() => setToastMensaje(""), 4000);
      }
    } catch (error) {
      const phase = error.phase || "unknown";
      console.error(`[App] Fallo crítico en fase [${phase}]:`, error);

      if (phase === "auth") authErrorRef.current = true;

      setSyncStatus((current) => ({
        ...current,
        status: "error",
        lastSync: new Date().toISOString(),
        errorSource: phase,
        errorMessage: error.message || "Error inesperado en sincronización.",
      }));

      setMensaje(`Error [${phase}]: ${error.message}`);
    }
  };

  const scheduleAutoSync = () => {
    if (AUTO_SYNC_MODE === "off") {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    setSyncStatus((current) => ({
      ...current,
      status: "idle", // Reset to idle before scheduling a new one
    }));

    syncTimeoutRef.current = window.setTimeout(() => {
      syncTimeoutRef.current = null;
      runAutoSync().catch((error) => {
        console.error("[App] AutoSync no controlada:", error);
        setSyncStatus((current) => ({
          ...current,
          status: "error",
          lastSync: new Date().toISOString(),
          errorMessage: error.message || "Falló la autosincronización.",
        }));
        setMensaje(`Error de sincronización: ${error.message || "Falló la autosincronización."}`);
      });
    }, 1200);
  };

  const {
    printMode,
    setPrintMode,
    labelsToPrint,
    setLabelsToPrint,
    boxReportToPrint,
    setBoxReportToPrint,
  } = usePrintManager(carrito);

  const productos = useLiveQuery(async () => { try { return await buscarProductos(busqueda); } catch { return []; } }, [busqueda]) || [];
  const inventario = useLiveQuery(async () => { try { return await db.productos.toArray(); } catch { return []; } }, []) || [];
  const ventas = useLiveQuery(async () => { try { return await db.ventas.toArray(); } catch { return []; } }, []) || [];
  const clientes = useLiveQuery(async () => { try { return await db.clientes.toArray(); } catch { return []; } }, []) || [];
  const cajas = useLiveQuery(async () => { try { return await db.cajas.toArray(); } catch { return []; } }, []) || [];

  useEffect(() => {
    seedClientesDemo();
  }, []);

  const subtotal = useMemo(() => carrito.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 1)), 0), [carrito]);
  const descuento = Math.max(0, Math.min(Number(montoDescuento || 0), subtotal));
  const total = Math.max(0, subtotal - descuento);
  const fechaClaveHoy = getTodayKey();
  const clienteSeleccionado = clientes.find((cliente) => String(cliente.id) === String(clienteSeleccionadoId)) || null;
  const inventarioFiltrado = inventario.filter((producto) => normalize([producto.codigo, producto.nombre, producto.categoria, producto.detalles, producto.talles].filter(Boolean).join(" ")).includes(normalize(busqueda)));
  const clientesFiltrados = clientes.filter((cliente) => normalize([cliente.nombre, cliente.telefono, cliente.dni].filter(Boolean).join(" ")).includes(normalize(clienteBusqueda)));
  const clientesConDeuda = clientes.filter((cliente) => Number(cliente.deuda || 0) > 0).length;
  const totalCobrado = ventas.reduce((acc, venta) => acc + (venta.enCuentaCorriente ? 0 : Number(venta.total || 0)), 0);
  const totalCuentaCorriente = clientes.reduce((acc, cliente) => acc + Number(cliente.deuda || 0), 0);
  const cajaDelDia = cajas.filter((sesion) => sesion.fechaClave === fechaClaveHoy).slice().sort((a, b) => new Date(b.fechaApertura || 0) - new Date(a.fechaApertura || 0))[0] || null;
  const ventasHoy = ventas.filter((venta) => isSameDay(venta.fecha, fechaClaveHoy));
  const ventasEfectivoHoy = ventasHoy.reduce((acc, venta) => acc + ((venta.cajaId === cajaDelDia?.id && venta.metodoPago === "Efectivo" && !venta.enCuentaCorriente) ? Number(venta.total || 0) : 0), 0);
  const ventasOtrosMediosHoy = ventasHoy.reduce((acc, venta) => acc + ((venta.cajaId === cajaDelDia?.id && venta.metodoPago !== "Efectivo" && !venta.enCuentaCorriente) ? Number(venta.total || 0) : 0), 0);
  const montoAperturaCaja = Number(cajaDelDia?.montoApertura || 0);
  const efectivoEsperadoCaja = montoAperturaCaja + ventasEfectivoHoy;
  const cajaAbiertaHoy = Boolean(cajaDelDia && !cajaDelDia.cerrada);

  useEffect(() => {
    if (!cajaAbiertaHoy && tab === "ventas") {
      setTab("resumen");
    }
  }, [cajaAbiertaHoy, tab]);

  useEffect(() => {
    if (montoRealCaja && !cierreCajaOpen) {
      setMontoRealCaja("");
    }
  }, [cierreCajaOpen, montoRealCaja]);

  useEffect(() => {
    if (isAuthenticated && cajaDelDia?.cerrada && cierreCajaOpen) {
      setCierreCajaOpen(false);
    }
  }, [cajaDelDia, cierreCajaOpen, isAuthenticated]);

  useEffect(() => {
    if (AUTO_SYNC_MODE === "off") {
      return undefined;
    }

    if (isAuthenticated) {
      if (!startupSyncStartedRef.current) {
        startupSyncStartedRef.current = true;
        runAutoSync().catch((error) => {
          console.error("[App] Fallo en sincronización inicial:", error.message);
          setSyncStatus((current) => ({
            ...current,
            status: "error",
            lastSync: new Date().toISOString(),
            errorSource: "startup",
            errorMessage: error.message || "Falló la sincronización inicial.",
          }));
          setMensaje(`Error de sincronización inicial: ${error.message || "Falló la sincronización inicial."}`);
        });
      }

      // Listener de reconexión para reintentos transparentes
      const handleOnline = () => {
         console.log("[App] Red recuperada. Intentando subir ventas pendientes...");
         runAutoSync().catch((error) => {
           console.error("[App] Fallo en sincronización por reconexión:", error.message);
           setSyncStatus((current) => ({
             ...current,
             state: "error",
             lastErrorAt: new Date().toISOString(),
             errorMessage: error.message || "Falló la sincronización por reconexión.",
           }));
           setMensaje(`Error de sincronización por reconexión: ${error.message || "Falló la sincronización por reconexión."}`);
         });
      };
      
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [isAuthenticated]);

  const handleSyncClientes = async () => {
    setMensaje("Sincronizando clientes con la nube...");
    setSyncStatus((current) => ({ ...current, status: "syncing", errorMessage: "", errorSource: "clientes" }));
    try {
      const res = await withTimeout(syncClientsNow(ownerUserId), "La sincronización manual de clientes", 60000);
      if (res.success) {
        setMensaje(`Sincronización completa. Subidos: ${res.pushed || 0}.`); // El pull ya no devuelve count individual fácilmente
        setSyncStatus((current) => ({ ...current, status: "success", lastSync: new Date().toISOString(), errorMessage: "", errorSource: null }));
      } else {
        throw new Error(res.error || "Desconocido");
      }
    } catch (err) {
      setMensaje(`Error sincronizando: ${err.message}`);
      setSyncStatus((current) => ({ ...current, status: "error", lastSync: new Date().toISOString(), errorSource: "clientes", errorMessage: err.message || "Error de sincronización." }));
    }
  };
  const handleSyncProductos = async () => {
    setMensaje("Sincronizando productos con la nube...");
    setSyncStatus((current) => ({ ...current, status: "syncing", errorMessage: "", errorSource: "productos" }));
    try {
      const res = await withTimeout(syncProductsNow(ownerUserId), "La sincronización manual de productos", 60000);
      if (res.success) {
        setMensaje(`Sincronización de productos completa. Subidos: ${res.pushed || 0}.`);
        setSyncStatus((current) => ({ ...current, status: "success", lastSync: new Date().toISOString(), errorMessage: "", errorSource: null }));
      } else {
        throw new Error(res.error || "Desconocido");
      }
    } catch (err) {
      setMensaje(`Error sincronizando productos: ${err.message}`);
      setSyncStatus((current) => ({ ...current, status: "error", lastSync: new Date().toISOString(), errorSource: "productos", errorMessage: err.message || "Error de sincronización." }));
    }
  };

  const handleSyncVentas = async () => {
    setMensaje("Sincronizando ventas a la nube...");
    setSyncStatus((current) => ({ ...current, status: "syncing", errorMessage: "", errorSource: "ventas" }));
    try {
      const res = await withTimeout(
        syncSalesNow(ownerUserId, false),
        "La sincronización manual de ventas",
        60000
      );
      if (res.success) {
        setMensaje(`Sincronización de ventas completa. Subidas: ${res.pushed || 0}.`);
        setSyncStatus((current) => ({ ...current, status: "success", lastSync: new Date().toISOString(), errorMessage: "", errorSource: null }));
      } else {
        throw new Error(res.error || "Desconocido");
      }
    } catch (err) {
      setMensaje(`Error sincronizando ventas: ${err.message}`);
      setSyncStatus((current) => ({ ...current, status: "error", lastSync: new Date().toISOString(), errorSource: "ventas", errorMessage: err.message || "Error de sincronización." }));
    }
  };

  const handleSyncCajas = async () => {
    setMensaje("Sincronizando cajas con la nube...");
    setSyncStatus((current) => ({ ...current, status: "syncing", errorMessage: "", errorSource: "cajas" }));
    try {
      const res = await withTimeout(syncBoxesNow(ownerUserId), "La sincronización manual de cajas", 60000);
      if (res.success) {
        setMensaje(`Sincronización de cajas completa. Subidas: ${res.pushed || 0}.`);
        setSyncStatus((current) => ({ ...current, status: "success", lastSync: new Date().toISOString(), errorMessage: "", errorSource: null }));
      } else {
        throw new Error(res.error || "Desconocido");
      }
    } catch (err) {
      setMensaje(`Error sincronizando cajas: ${err.message}`);
      setSyncStatus((current) => ({ ...current, status: "error", lastSync: new Date().toISOString(), errorSource: "cajas", errorMessage: err.message || "Error de sincronización." }));
    }
  };

  const handleRepairSync = async () => {
    if (!window.confirm("¿Estás seguro? Esto reseteará las marcas de sincronización local para forzar una subida completa. Útil si borraste datos en la nube.")) return;
    setMensaje("Reparando metadatos de sincronización...");
    try {
      const { repairSyncMetadata } = await import("./services/syncRepair");
      const res = await repairSyncMetadata();
      if (res.success) {
        setMensaje("Metadatos reparados. Iniciando sincronización forzada...");
        runAutoSync();
      } else {
        setMensaje(`Error al reparar: ${res.error}`);
      }
    } catch (e) {
      setMensaje(`Fallo al cargar utilidad de reparación: ${e.message}`);
    }
  };

  const handleForceRescan = async () => {
    if (!isAuthenticated || !navigator.onLine) {
      setMensaje("Se necesita conexión a internet para el re-escaneo.");
      return;
    }
    setSyncStatus((current) => ({ ...current, status: "syncing", errorMessage: "", errorSource: null }));
    try {
      // Forzar pull de ventas (force=true ignora caché) + productos
      const [salesRes, productsRes] = await Promise.all([
        withTimeout(syncSalesNow(ownerUserId, true), "Re-escaneo de ventas", 60000),
        withTimeout(syncProductsNow(ownerUserId), "Re-escaneo de productos", 60000),
      ]);

      const nuevas = (salesRes.pulled ?? 0);
      const actualizadas = (salesRes.updated ?? 0);
      const totalMsg = nuevas > 0
        ? `Sincronización completa. ${nuevas} venta${nuevas > 1 ? 's' : ''} nueva${nuevas > 1 ? 's' : ''} integrada${nuevas > 1 ? 's' : ''}.`
        : `Sincronización completa. Todo al día (${actualizadas} registros actualizados).`;

      setSyncStatus({ status: "success", lastSync: new Date().toISOString(), errorSource: null, errorMessage: "" });
      setToastMensaje(totalMsg);
      setTimeout(() => setToastMensaje(""), 5000);
    } catch (err) {
      setSyncStatus((current) => ({ ...current, status: "error", lastSync: new Date().toISOString(), errorSource: "rescan", errorMessage: err.message || "Error en re-escaneo." }));
      setMensaje(`Error en re-escaneo: ${err.message}`);
    }
  };

  const handleRunSyncDiagnostics = async () => {
    setMensaje("Ejecutando diagnóstico de sincronización en consola...");
    console.log("--- Diagnóstico de Sincronización ---");
    console.log("Estado actual:", syncStatus);
    console.log("Internet:", navigator.onLine ? "ONLINE" : "OFFLINE");
    const counts = {
      productos: await db.productos.count(),
      clientes: await db.clientes.count(),
      ventas: await db.ventas.count(),
      cajas: await db.cajas.count(),
      syncQueue: await db.syncQueue.count(),
    };
    console.table(counts);
    const pendings = {
      productos: await db.productos.where("synced").equals(0).count(),
      clientes: await db.clientes.where("synced").equals(0).count(),
      ventas: await db.ventas.where("sync_status").equals("pending").count(),
      cajas: await db.cajas.where("synced").equals(0).count(),
    };
    console.log("Pendientes de subir:", pendings);
    setMensaje("Diagnóstico finalizado. Revisa la consola (F12) para ver los resultados.");
  };

  const addToCart = (producto, talle = "Unico") => {
    console.log("[sales-flow] addToCart called", {
      productoId: producto?.id ?? null,
      nombre: producto?.nombre ?? "",
      codigo: producto?.codigo ?? producto?.sku ?? "",
      talle,
    });
    setCarrito((actual) => {
      const existingIndex = actual.findIndex((item) => String(item.productoId) === String(producto.id) && String(item.talle) === String(talle));
      
      // Calculate total quantity of this product already in cart
      const cantidadEnCarrito = actual.filter((item) => String(item.productoId) === String(producto.id)).reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
      const stockDisponible = Number(producto.stock || 0);

      if (cantidadEnCarrito + 1 > stockDisponible) {
        setMensaje(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${producto.nombre}.`);
        return actual; // Cancel addition if it exceeds stock
      }

      if (existingIndex >= 0) {
        const updated = [...actual];
        const currentQty = Number(updated[existingIndex].cantidad || 1);
        updated[existingIndex] = { ...updated[existingIndex], cantidad: currentQty + 1 };
        return updated;
      }
      return [...actual, { idTemporal: `${producto.id}-${talle}-${Date.now()}`, productoId: producto.id, codigo: producto.codigo || producto.sku || "", nombre: producto.nombre, detalles: producto.detalles || "", categoria: producto.categoria, precio: Number(producto.precio || 0), talle, foto: producto.foto || "", cantidad: 1, stock: stockDisponible }];
    });
    setMensaje(`${producto.nombre} agregado al carrito.`);
    setToastMensaje(`Producto cargado: ${producto.nombre}`);
  };

  const { cameraContainerId, processCode, closeCameraScanner } = useBarcodeScanner({
    tab,
    cameraOpen,
    setCameraOpen,
    setCameraError,
    setCameraLoading,
    setScannerCodigo,
    setMensaje,
    setLastDetectedCode,
    addToCart,
    scannerRef,
  });

  const handleSalesCodeSubmit = (rawCode, source = "unknown") => {
    const code = String(rawCode ?? "");
    console.log("[sales-flow] submit requested", {
      source,
      rawCode,
      code,
      trimmed: code.trim(),
    });
    if (source.startsWith("manual") && cameraOpen) {
      console.log("[sales-flow] closing camera to isolate manual submit");
      closeCameraScanner();
    }
    return processCode(code);
  };

  useEffect(() => {
    console.log("[sales-flow] carrito updated", {
      items: carrito.map((item) => ({
        idTemporal: item.idTemporal,
        productoId: item.productoId,
        nombre: item.nombre,
        codigo: item.codigo,
        talle: item.talle,
        cantidad: item.cantidad,
      })),
      totalItems: carrito.length,
    });
  }, [carrito]);

  useEffect(() => {
    if (!toastMensaje) return undefined;
    const timeoutId = window.setTimeout(() => setToastMensaje(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toastMensaje]);

  useEffect(() => () => {
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      startupSyncStartedRef.current = false;
      syncInFlightRef.current = false;
      authErrorRef.current = false; // Reset al cerrar sesión
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setSyncStatus({
        status: "idle",
        lastSync: null,
        errorSource: null,
        errorMessage: "",
      });
    }
  }, [isAuthenticated]);

  const resetForm = () => {
    setForm({ codigo: "", nombre: "", precio: "", categoria: "", talles: "", foto: "", detalles: "", stock: "0", stock_minimo: "3" });
    setEditando(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveProduct = async () => {
    if (!form.nombre.trim()) {
      setMensaje("El producto necesita al menos un nombre.");
      return;
    }

    const precio = Number(form.precio || 0);
    if (!Number.isFinite(precio) || precio < 0) {
      setMensaje("El precio debe ser un numero valido mayor o igual a cero.");
      return;
    }

    let codigo = form.codigo.trim();
    if (!codigo) {
      codigo = generateEANLikeCode();
    }

    const existente = await db.productos.where("codigo").equals(codigo).first();
    if (existente && existente.id !== editando) {
      setMensaje(`El codigo ${codigo} ya esta asignado a otro producto.`);
      return;
    }

    const payload = {
      codigo,
      nombre: form.nombre.trim(),
      precio,
      categoria: form.categoria.trim(),
      talles: form.talles.trim(),
      foto: form.foto || "",
      detalles: form.detalles.trim(),
      stock: Number(form.stock || 0),
      stock_minimo: sanitizeInt(form.stock_minimo, 3),
      updated_at: new Date().toISOString(),
      synced: 0,
    };

    try {
      if (editando) {
        await db.productos.update(editando, payload);
        setMensaje(`"${payload.nombre}" actualizado correctamente.`);
      } else {
        await crearProducto({ ...payload, codigo: codigo || "" });
        setMensaje(`"${payload.nombre}" guardado correctamente.`);
      }
      scheduleAutoSync();
      resetForm();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    }
  };

  const editProduct = (producto) => {
    setEditando(producto.id);
    setForm({ codigo: producto.codigo || "", nombre: producto.nombre || "", precio: String(producto.precio ?? ""), categoria: producto.categoria || "", talles: producto.talles || "", foto: producto.foto || "", detalles: producto.detalles || "", stock: String(producto.stock ?? "0"), stock_minimo: String(producto.stock_minimo ?? "3") });
  };

  const deleteProduct = async (producto) => {
    if (!window.confirm(`Se eliminara "${producto.nombre}". Queres continuar?`)) return;
    await db.productos.delete(producto.id);
    await enqueueSyncAction("productos", "delete", { id: producto.id });
    setMensaje(`"${producto.nombre}" se elimino del inventario.`);
    scheduleAutoSync();
    if (editando === producto.id) resetForm();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm((actual) => ({ ...actual, foto: compressed }));
      setMensaje("Imagen optimizada y lista para guardarse.");
    } catch {
      setMensaje("No se pudo procesar la imagen seleccionada.");
    }
  };

  const resetClienteForm = () => {
    setClienteForm({ nombre: "", telefono: "", dni: "" });
    setClienteEditando(null);
  };

  const saveCliente = async () => {
    if (!clienteForm.nombre.trim()) {
      setMensaje("El cliente necesita un nombre.");
      return;
    }
    const payload = { 
      nombre: clienteForm.nombre.trim(), 
      telefono: clienteForm.telefono.trim(), 
      dni: clienteForm.dni.trim(),
      updated_at: new Date().toISOString(),
      synced: 0
    };
    if (clienteEditando) {
      await db.clientes.update(clienteEditando, payload);
      setMensaje(`"${payload.nombre}" actualizado correctamente.`);
    } else {
      const remote_id = crypto.randomUUID();
      const id = await db.clientes.add({ ...payload, deuda: 0, remote_id });
      setMensaje(`"${payload.nombre}" agregado a clientes.`);
    }
    scheduleAutoSync();
    resetClienteForm();
  };

  const editCliente = (cliente) => {
    setClienteEditando(cliente.id);
    setClienteForm({ nombre: cliente.nombre || "", telefono: cliente.telefono || "", dni: cliente.dni || "" });
  };

  const deleteCliente = async (cliente) => {
    if (Number(cliente.deuda || 0) > 0) {
      setMensaje(`No se puede borrar a ${cliente.nombre} porque tiene una deuda pendiente de ${currency.format(cliente.deuda)}.`);
      return;
    }
    if (!window.confirm(`Se eliminara el cliente "${cliente.nombre}". Queres continuar?`)) return;
    await db.clientes.delete(cliente.id);
    await enqueueSyncAction("clientes", "delete", { id: cliente.id });
    setMensaje(`Cliente "${cliente.nombre}" eliminado correctamente.`);
    scheduleAutoSync();
    if (clienteEditando === cliente.id) resetClienteForm();
  };

  const registrarPagoCliente = async (cliente) => {
    const monto = Number(pagosClientes[cliente.id] || 0);
    if (monto <= 0) {
      setMensaje("Ingresa un monto valido para registrar el pago.");
      return;
    }
    const deudaActual = Number(cliente.deuda || 0);
    if (monto > deudaActual) {
      setMensaje(`El pago supera la deuda actual de ${currency.format(deudaActual)}.`);
      return;
    }
    const nuevaDeuda = Math.max(0, deudaActual - monto);
    const updated_at = new Date().toISOString();
    await db.clientes.update(cliente.id, { 
      deuda: nuevaDeuda, 
      updated_at,
      synced: 0 
    });
    setPagosClientes((actual) => ({ ...actual, [cliente.id]: "" }));
    setMensaje(`Pago registrado para ${cliente.nombre}. Nueva deuda: ${currency.format(nuevaDeuda)}.`);
    scheduleAutoSync();
  };

  const exportBackupJson = async () => {
    try {
      const backup = await exportBackupData();
      const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
      download(`backup-tienda-nancy-${stamp}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8;");
      setMensaje("Backup JSON exportado correctamente.");
    } catch (error) {
      console.error("Error exportando backup:", error);
      setMensaje("No se pudo exportar el backup JSON.");
    }
  };

  const onImportBackupClick = () => {
    if (!backupInputRef.current) return;
    backupInputRef.current.value = "";
    backupInputRef.current.click();
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const resume = await importBackupData(parsed);
      setMensaje(`Backup importado: ${resume.productos} productos, ${resume.clientes} clientes, ${resume.ventas} ventas y ${resume.cajas} cajas.`);
      scheduleAutoSync();
    } catch (error) {
      console.error("Error importando backup:", error);
      setMensaje(error instanceof Error ? error.message : "El archivo de backup no es valido o no pudo importarse.");
    }
  };

  const finalizar = async () => {
    if (!carrito.length) return;
    if (!cajaAbiertaHoy) {
      setMensaje("Necesitas una caja abierta para registrar ventas.");
      return;
    }
    if (anotarEnCuentaCorriente && !clienteSeleccionado) {
      setMensaje("Selecciona un cliente para anotar la venta en cuenta corriente.");
      return;
    }
    const clienteSale = anotarEnCuentaCorriente ? clienteSeleccionado : (clienteVentaRapida.nombre || clienteVentaRapida.telefono ? { id: "temp", nombre: clienteVentaRapida.nombre, telefono: clienteVentaRapida.telefono } : null);
    try {
      const venta = await registrarVenta(carrito, { metodoPago, montoDescuento: descuento, total, enCuentaCorriente: anotarEnCuentaCorriente, cliente: clienteSale, cajaId: cajaDelDia?.id ?? null, fechaClave: fechaClaveHoy });
      setUltimaVenta(venta);
      setCarrito([]);
      setMontoDescuento("");
      setMetodoPago("Efectivo");
      setAnotarEnCuentaCorriente(false);
      setClienteSeleccionadoId("");
      setClienteVentaRapida({ nombre: "", telefono: "" });
      setMensaje(venta.enCuentaCorriente ? `Venta #${venta.id} anotada en la cuenta corriente de ${venta.clienteNombre} por ${currency.format(venta.total)}.` : `Venta #${venta.id} registrada por ${currency.format(venta.total)} con ${venta.metodoPago}.`);
      scheduleAutoSync();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    }
  };

  const imprimirTicket = () => {
    if (!carrito.length) return;
    setPrintMode("ticket");
  };

  const abrirCaja = async () => {
    const monto = Number(montoApertura || 0);
    if (monto < 0) {
      setMensaje("El monto de apertura no puede ser negativo.");
      return;
    }
    try {
      const now = new Date().toISOString();
      if (cajaDelDia?.cerrada) {
        await db.cajas.update(cajaDelDia.id, {
          montoApertura: monto,
          fechaApertura: now,
          fechaCierre: null,
          abierta: true,
          cerrada: false,
          montoCierreReal: null,
          diferenciaCierre: null,
          efectivoEsperado: null,
          ventasEfectivo: 0,
          ventasOtrosMedios: 0,
          updated_at: now,
          synced: 0,
        });
        setMensaje(`Caja reabierta con ${currency.format(monto)}.`);
      } else {
        await db.cajas.add({
          fechaClave: fechaClaveHoy,
          montoApertura: monto,
          fechaApertura: now,
          abierta: true,
          cerrada: false,
          montoCierreReal: null,
          diferenciaCierre: null,
          remote_id: crypto.randomUUID(),
          updated_at: now,
          synced: 0,
        });
        setMensaje(`Caja abierta con ${currency.format(monto)}.`);
      }
      setMontoApertura("");
      setAperturaCajaOpen(false);
      scheduleAutoSync();
    } catch (error) {
      console.error("Error al abrir caja:", error);
      setMensaje("No se pudo abrir la caja. Revisa la consola para mas detalles.");
    }
  };

  const confirmarCierreCaja = async () => {
    if (!cajaDelDia || cajaDelDia.cerrada) return;
    const montoReal = Number(montoRealCaja || 0);
    if (!Number.isFinite(montoReal) || montoReal < 0) {
      setMensaje("El monto real debe ser un numero valido mayor o igual a cero.");
      return;
    }
    const diferencia = montoReal - efectivoEsperadoCaja;
    const report = {
      cajaId: cajaDelDia.id,
      fechaClave: fechaClaveHoy,
      fechaCierre: new Date().toISOString(),
      montoApertura: montoAperturaCaja,
      ventasEfectivo: ventasEfectivoHoy,
      ventasOtrosMedios: ventasOtrosMediosHoy,
      efectivoEsperado: efectivoEsperadoCaja,
      montoReal,
      diferencia,
    };

    try {
      await db.cajas.update(cajaDelDia.id, {
        cerrada: true,
        abierta: false,
        fechaCierre: report.fechaCierre,
        montoCierreReal: montoReal,
        diferenciaCierre: diferencia,
        efectivoEsperado: efectivoEsperadoCaja,
        ventasEfectivo: ventasEfectivoHoy,
        ventasOtrosMedios: ventasOtrosMediosHoy,
        updated_at: new Date().toISOString(),
        synced: 0,
      });
      setBoxReportToPrint(report);
      setPrintMode("box-report");
      setCierreCajaOpen(false);
      setMontoRealCaja("");
      setMensaje(diferencia === 0 ? "Caja cerrada sin diferencias." : diferencia > 0 ? `Caja cerrada con sobrante de ${currency.format(diferencia)}.` : `Caja cerrada con faltante de ${currency.format(Math.abs(diferencia))}.`);
      scheduleAutoSync();
    } catch (error) {
      console.error("Error al cerrar caja:", error);
      setMensaje("No se pudo cerrar la caja. Revisa la consola para mas detalles.");
    }
  };

  // Reset de estado local al cerrar sesión (complementa el signOut del contexto)
  useEffect(() => {
    if (!isAuthenticated) {
      setMontoApertura("");
      setCierreCajaOpen(false);
      setMontoRealCaja("");
      setBoxReportToPrint(null);
      setProductoEtiqueta(null);
      setLabelsToPrint([]);
      setPrintMode(null);
    }
  }, [isAuthenticated]);

  const buildLabelsForProduct = (producto, selectedTalles) => {
    const barcodeValue = getBarcodeValue(producto);
    if (!barcodeValue) {
      setMensaje(`"${producto.nombre}" no tiene codigo, SKU o ID valido para generar la etiqueta.`);
      return [];
    }
    return selectedTalles.map((talle) => ({
      productoId: producto.id,
      nombre: producto.nombre,
      talle,
      precio: Number(producto.precio || 0),
      barcodeValue,
    }));
  };

  const openLabelDialog = (producto) => {
    setProductoEtiqueta(producto);
  };

  const printSingleLabel = (producto, talle) => {
    const labels = buildLabelsForProduct(producto, [talle]);
    if (!labels.length) return;
    setProductoEtiqueta(null);
    setLabelsToPrint(labels);
    setPrintMode("labels");
  };

  const printAllLabels = (producto) => {
    const disponibles = talles(producto.talles);
    const labels = buildLabelsForProduct(producto, disponibles.length ? disponibles : ["Unico"]);
    if (!labels.length) return;
    setProductoEtiqueta(null);
    setLabelsToPrint(labels);
    setPrintMode("labels");
  };

  const buildWhatsAppUrl = (venta) => {
    if (!venta) return null;
    const nombre = venta.clienteNombre || "cliente";
    const detalle = (venta.articulos || []).map((item) => `${item.nombre} (${item.talle || "Unico"})`).join(", ");
    const texto = `Hola ${nombre}, gracias por tu compra en Tienda Nancy. Detalle: ${detalle}. Total: ${currency.format(venta.total)}. ¡Te esperamos pronto!`;
    const telefono = String(venta.clienteTelefono || "").replace(/\D/g, "");
    if (telefono.length < 8) return null;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
  };

  const enviarWhatsApp = () => {
    if (!ultimaVenta) return;
    const url = buildWhatsAppUrl(ultimaVenta);
    if (!url) {
      setMensaje("El cliente no tiene telefono cargado para WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const clearHistory = async () => {
    if (!ventas.length && !cajas.length) return;
    if (!window.confirm("Se eliminaran ventas, deudas y cierres de caja guardados. Queres continuar?")) return;
    await clearCommercialHistory();
    setUltimaVenta(null);
    setCarrito([]);
    setMontoDescuento("");
    setAnotarEnCuentaCorriente(false);
    setClienteSeleccionadoId("");
    setCierreCajaOpen(false);
    setMontoRealCaja("");
    setBoxReportToPrint(null);
    setMensaje("Historial comercial vaciado. Las deudas y cajas se reiniciaron para evitar inconsistencias.");
    scheduleAutoSync();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <style>{printStyles}</style>
      {/* Pantalla de Login — cuando no hay sesión activa de Supabase */}
      {!isAuthenticated && !authLoading ? <LoginScreen /> : null}
      {isAuthenticated ? (
        <div className="print-hidden">
          {toastMensaje ? <div className="pointer-events-none fixed right-4 top-4 z-70 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-2xl shadow-emerald-900/30 backdrop-blur">{toastMensaje}</div> : null}
          <div className="mx-auto max-w-7xl px-4 py-3 md:px-6 xl:px-8">
            <PWABanners />
          </div>
          <Header tabActiva={tab} onTabChange={setTab} onLogout={handleLogout} syncStatus={syncStatus} cantidadProductos={inventario.length} ventasRegistradas={ventas.length} carritoCantidad={carrito.reduce((acc, item) => acc + Number(item.cantidad || 1), 0)} clientesConDeuda={clientesConDeuda} cajaAbierta={cajaAbiertaHoy} cajaTotalEfectivo={efectivoEsperadoCaja} />
          <main className="mx-auto max-w-7xl px-3 py-8 sm:px-4 md:px-6 xl:px-8">
            <StatusBanners ultimaVenta={ultimaVenta} enviarWhatsApp={enviarWhatsApp} mensaje={mensaje} />
            {tab === "dashboard" ? <DashboardSection ventas={ventas} productos={inventario} clientes={clientes} onNavigate={(to, state) => { setTab(to); setNavState(state); }} /> : null}
            {tab === "ventas" ? <SalesSection busqueda={busqueda} setBusqueda={setBusqueda} categoriaFiltro={categoriaFiltro} setCategoriaFiltro={setCategoriaFiltro} inventario={inventario} cameraOpen={cameraOpen} setCameraError={setCameraError} setCameraOpen={setCameraOpen} closeCameraScanner={closeCameraScanner} cameraContainerId={cameraContainerId} cameraLoading={cameraLoading} cameraError={cameraError} lastDetectedCode={lastDetectedCode} productos={productos} addToCart={addToCart} scannerCodigo={scannerCodigo} setScannerCodigo={setScannerCodigo} processCode={processCode} handleSalesCodeSubmit={handleSalesCodeSubmit} scannerRef={scannerRef} carrito={carrito} setCarrito={setCarrito} metodoPago={metodoPago} setMetodoPago={setMetodoPago} montoDescuento={montoDescuento} setMontoDescuento={setMontoDescuento} imprimirTicket={imprimirTicket} finalizar={finalizar} clientes={clientes} anotarEnCuentaCorriente={anotarEnCuentaCorriente} setAnotarEnCuentaCorriente={setAnotarEnCuentaCorriente} clienteSeleccionadoId={clienteSeleccionadoId} setClienteSeleccionadoId={setClienteSeleccionadoId} clienteVentaRapida={clienteVentaRapida} setClienteVentaRapida={setClienteVentaRapida} /> : null}
            {tab === "inventario" ? <InventorySection navState={navState} setNavState={setNavState} form={form} setForm={setForm} fileInputRef={fileInputRef} handleImageChange={handleImageChange} saveProduct={saveProduct} editando={editando} resetForm={resetForm} busqueda={busqueda} setBusqueda={setBusqueda} inventarioFiltrado={inventarioFiltrado} editProduct={editProduct} deleteProduct={deleteProduct} openLabelDialog={openLabelDialog} /> : null}
            {tab === "clientes" ? <ClientsSection navState={navState} setNavState={setNavState} clienteBusqueda={clienteBusqueda} setClienteBusqueda={setClienteBusqueda} clienteEditando={clienteEditando} clienteForm={clienteForm} setClienteForm={setClienteForm} saveCliente={saveCliente} resetClienteForm={resetClienteForm} clientesFiltrados={clientesFiltrados} pagosClientes={pagosClientes} setPagosClientes={setPagosClientes} registrarPagoCliente={registrarPagoCliente} editCliente={editCliente} deleteCliente={deleteCliente} handleSyncClientes={handleSyncClientes} /> : null}
            {tab === "resumen" ? <SummarySection ventas={ventas} cajas={cajas} exportBackupJson={exportBackupJson} onImportBackupClick={onImportBackupClick} backupInputRef={backupInputRef} handleImportBackup={handleImportBackup} cajaAbiertaHoy={cajaAbiertaHoy} setCierreCajaOpen={setCierreCajaOpen} setAperturaCajaOpen={setAperturaCajaOpen} clearHistory={clearHistory} totalCobrado={totalCobrado} totalCuentaCorriente={totalCuentaCorriente} montoAperturaCaja={montoAperturaCaja} ventasEfectivoHoy={ventasEfectivoHoy} ventasOtrosMediosHoy={ventasOtrosMediosHoy} efectivoEsperadoCaja={efectivoEsperadoCaja} cajaDelDia={cajaDelDia} boxReportToPrint={boxReportToPrint} setPrintMode={setPrintMode} setBoxReportToPrint={setBoxReportToPrint} onSync={runAutoSync} onForceRescan={handleForceRescan} syncStatus={syncStatus} /> : null}
          </main>
        </div>
      ) : null}
      {isAuthenticated && ((!cajaDelDia) || aperturaCajaOpen) ? <CajaAperturaModal monto={montoApertura} onChange={setMontoApertura} onConfirm={abrirCaja} onClose={cajaDelDia ? () => setAperturaCajaOpen(false) : undefined} title={cajaDelDia?.cerrada ? "Reabrir Caja" : "Apertura de Caja"} description={cajaDelDia?.cerrada ? "La caja del día está cerrada. Ingresa el nuevo monto inicial para volver a operar." : "Ingresa el efectivo inicial disponible para cambio. Esta apertura queda registrada para la jornada actual."} /> : null}
      {isAuthenticated && cierreCajaOpen && cajaAbiertaHoy ? <CajaCierreModal apertura={montoAperturaCaja} ventasEfectivo={ventasEfectivoHoy} esperado={efectivoEsperadoCaja} montoReal={montoRealCaja} onMontoRealChange={setMontoRealCaja} onConfirm={confirmarCierreCaja} onClose={() => setCierreCajaOpen(false)} /> : null}
      {productoEtiqueta ? <LabelPrintDialog producto={productoEtiqueta} onClose={() => setProductoEtiqueta(null)} onPrintSize={printSingleLabel} onPrintAll={printAllLabels} /> : null}
      <section className={printMode === "ticket" ? "print-only print-only-active" : "print-only print-only-inactive"}>
        <PrintableTicket carrito={carrito} descuento={descuento} metodoPago={metodoPago} total={total} clienteNombre={clienteSeleccionado?.nombre || ""} enCuentaCorriente={anotarEnCuentaCorriente} />
      </section>
      <section className={printMode === "labels" ? "print-only print-only-active" : "print-only print-only-inactive"}>
        <PrintableLabels labels={labelsToPrint} />
      </section>
      <section className={printMode === "box-report" ? "print-only print-only-active" : "print-only print-only-inactive"}>
        <PrintableBoxReport report={boxReportToPrint} />
      </section>
    </div>
  );
}













