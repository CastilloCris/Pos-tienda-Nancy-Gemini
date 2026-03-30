import Dexie from "dexie";

export const db = new Dexie("TiendaNancyDB");

db.version(1).stores({
  productos: "++id, nombre, precio, categoria",
  ventas: "++id, fecha, total",
});

db.version(2).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, total, metodoPago",
});

db.version(3).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, total, metodoPago, enCuentaCorriente, clienteId",
  clientes: "++id, nombre, telefono, deuda",
});

db.version(4).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, total, metodoPago, enCuentaCorriente, clienteId",
  clientes: "++id, nombre, telefono, deuda",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
});

db.version(5).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId",
  clientes: "++id, nombre, telefono, deuda",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
});

db.version(6).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId",
  clientes: "++id, nombre, telefono, deuda",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  await tx.table("productos").toCollection().modify((producto) => {
    const cleaned = String(producto.codigo || "").trim();
    if (!cleaned) {
      delete producto.codigo;
      return;
    }
    producto.codigo = cleaned;
  });
});

db.version(7).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId",
  clientes: "++id, nombre, telefono, deuda",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  await tx.table("productos").toCollection().modify((producto) => {
    const cleaned = String(producto.codigo || "").trim();
    if (cleaned) {
      producto.codigo = cleaned;
    } else {
      delete producto.codigo;
    }
  });
});

db.version(8).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId",
  clientes: "++id, nombre, telefono, deuda",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  let counter = 0;
  await tx.table("productos").toCollection().modify((producto) => {
    const cleaned = String(producto.codigo || "").trim();
    if (!cleaned) {
      counter++;
      const randomSuffix = String(counter).padStart(3, "0");
      producto.codigo = "779" + String(Date.now()).slice(-6) + randomSuffix;
    }
  });
});

db.version(10).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId",
  clientes: "++id, nombre, telefono, deuda, updated_at, remote_id",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  await tx.table("productos").toCollection().modify((producto) => {
    if (producto.detalles === undefined) {
      producto.detalles = "";
    }
    if (producto.stock === undefined) {
      producto.stock = 0;
      producto.stock_minimo = 3;
    }
  });
  await tx.table("clientes").toCollection().modify((cliente) => {
    if (cliente.dni === undefined) {
      cliente.dni = "";
    }
    if (cliente.updated_at === undefined) {
      cliente.updated_at = new Date().toISOString();
    }
  });
});

db.version(11).stores({
  productos: "++id, codigo, nombre, precio, categoria",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId, remote_id, sync_status",
  clientes: "++id, nombre, telefono, deuda, updated_at, remote_id",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  await tx.table("ventas").toCollection().modify((venta) => {
    if (venta.remote_id === undefined) {
       venta.remote_id = crypto.randomUUID();
    }
    if (venta.sync_status === undefined) {
       venta.sync_status = "pending";
    }
    if (venta.updated_at === undefined) {
       venta.updated_at = new Date().toISOString();
    }
  });
});

// v12 — Agrega índices sobre stock/stock_minimo (productos) y updated_at (ventas/clientes).
// No migra ni borra datos existentes, solo amplía las rutas de búsqueda indexadas.
db.version(12).stores({
  productos: "++id, codigo, nombre, precio, categoria, stock, stock_minimo",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId, remote_id, sync_status, updated_at",
  clientes: "++id, nombre, telefono, dni, deuda, updated_at, remote_id",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  syncQueue: "++id, entidad, accion, createdAt, synced",
});


db.version(15).stores({
  productos: "++id, codigo, nombre, precio, categoria, stock, stock_minimo, updated_at, remote_id, synced",
  ventas: "++id, fecha, fechaClave, total, metodoPago, enCuentaCorriente, clienteId, cajaId, remote_id, updated_at, synced",
  clientes: "++id, nombre, telefono, dni, deuda, updated_at, remote_id, synced",
  sesionesCaja: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre",
  cajas: "++id, fechaClave, abierta, cerrada, fechaApertura, fechaCierre, updated_at, remote_id, synced",
  syncQueue: "++id, entidad, accion, createdAt, synced",
}).upgrade(async (tx) => {
  // Script de reparación profunda para normalizar synced: 0
  const tables = ["productos", "ventas", "clientes", "cajas"];
  for (const tableName of tables) {
    if (tx.table(tableName)) {
      await tx.table(tableName).toCollection().modify((item) => {
        if (item.synced === undefined) item.synced = 0;
        // Limpiamos rastro histórico de sync_status
        if (item.sync_status !== undefined) delete item.sync_status;
      });
    }
  }
});

db.open().catch((error) => {
  console.error("Dexie open failed:", {
    dbName: db.name,
    dbVersion: db.verno,
    tables: db.tables.map((table) => table.name),
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
    failures: error?.failures || null,
    inner: error?.inner || null,
  });
});

const normalizar = (texto = "") =>
  texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const sanitizeMoney = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("El monto debe ser un numero valido mayor o igual a cero.");
  }
  return parsed;
};

/**
 * Convierte cualquier valor a entero seguro.
 * Maneja "", null, undefined y NaN devolviendo `defaultVal`.
 */
export const sanitizeInt = (value, defaultVal = 0) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultVal;
};

export const crearProducto = async ({ codigo, nombre, precio, categoria, talles, foto, detalles, stock, stock_minimo }) => {
  const nombreLimpio = String(nombre || "").trim();
  if (!nombreLimpio) {
    throw new Error("El producto necesita un nombre.");
  }
  let codigoLimpio = String(codigo || "").trim();
  if (!codigoLimpio) {
    codigoLimpio = "779" + String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  }
  const existente = await db.productos.where("codigo").equals(codigoLimpio).first();
  if (existente) {
    throw new Error("Ya existe un producto con ese codigo.");
  }
  const updated_at = new Date().toISOString();
  const payload = {
    codigo: codigoLimpio,
    nombre: nombreLimpio,
    precio: sanitizeMoney(precio || 0),
    categoria: String(categoria || "").trim(),
    talles: String(talles || "").trim(),
    foto: foto || "",
    detalles: String(detalles || "").trim(),
    stock: sanitizeInt(stock, 0),
    stock_minimo: sanitizeInt(stock_minimo, 3),
    remote_id: crypto.randomUUID(),
    updated_at,
    synced: 0, // Nuevo/modificado localmente = Pendiente de sincronizar
  };
  const id = await db.productos.add(payload);
  return id;
};

export const buscarProductos = async (busqueda = "") => {
  const texto = normalizar(busqueda);
  const productos = await db.productos.toArray();

  if (!texto) {
    return productos;
  }

  return productos.filter((producto) => {
    const indice = normalizar(
      [producto.codigo, producto.nombre, producto.categoria, producto.detalles, producto.talles].filter(Boolean).join(" "),
    );

    return indice.includes(texto);
  });
};

export const registrarVenta = async (items, opciones = {}) => {
  if (!items.length) {
    throw new Error("El ticket esta vacio.");
  }

  const subtotal = items.reduce((acumulado, item) => acumulado + (Number(item.precio || 0) * Number(item.cantidad || 1)), 0);
  const montoDescuento = sanitizeMoney(opciones.montoDescuento ?? opciones.descuentoAplicado ?? 0);
  const total = sanitizeMoney(opciones.total ?? subtotal - montoDescuento);
  const enCuentaCorriente = Boolean(opciones.enCuentaCorriente);
  const cliente = opciones.cliente || null;

  if (total > subtotal) {
    throw new Error("El total de la venta no puede superar al subtotal calculado.");
  }

  const venta = {
    fecha: new Date().toISOString(),
    fechaClave: opciones.fechaClave || new Date().toISOString().slice(0, 10),
    subtotal,
    descuentoAplicado: montoDescuento,
    montoDescuento,
    total,
    metodoPago: enCuentaCorriente ? "Cuenta Corriente" : opciones.metodoPago || "Efectivo",
    enCuentaCorriente,
    cajaId: opciones.cajaId ?? null,
    clienteId: cliente?.id ?? null,
    clienteNombre: cliente?.nombre || "",
    clienteTelefono: cliente?.telefono || "",
    articulos: items.map((item) => ({
      productoId: item.productoId,
      codigo: item.codigo || "",
      nombre: item.nombre,
      categoria: item.categoria,
      precio: Number(item.precio || 0),
      cantidad: Number(item.cantidad || 1),
      talle: item.talle,
      foto: item.foto || "",
    })),
    remote_id: crypto.randomUUID(),
    synced: 0,
    updated_at: new Date().toISOString()
  };

  const id = await db.transaction("rw", db.ventas, db.clientes, db.productos, db.syncQueue, async () => {
    // 1. Validar y descontar stock transaccionalmente
    for (const item of items) {
      if (item.productoId) {
        const producto = await db.productos.get(item.productoId);
        if (producto) {
          const cantidadPedida = Number(item.cantidad || 1);
          const stockActual = Number(producto.stock || 0);
          
          if (stockActual < cantidadPedida) {
            throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${stockActual}, Solicitado: ${cantidadPedida}`);
          }
          
          const nuevoStock = stockActual - cantidadPedida;
          await db.productos.update(producto.id, { 
            stock: nuevoStock, 
            updated_at: new Date().toISOString(),
            synced: 0 
          });
        }
      }
    }

    // 2. Gestionar deuda si es cuenta corriente
    if (enCuentaCorriente && cliente?.id) {
      const deudaActual = Number(cliente.deuda || 0);
      const nuevaDeuda = deudaActual + total;
      const updated_at = new Date().toISOString();
      await db.clientes.update(cliente.id, { 
        deuda: nuevaDeuda, 
        updated_at,
        synced: 0 
      });
    }

    // 3. Registrar la venta
    return db.ventas.add(venta);
  });

  return { id, ...venta };
};

export const enqueueSyncAction = async (entidad, accion, payload = null) => {
  if (!db.syncQueue) return null;
  // Solo encolamos acciones de tipo 'delete' según nuevos lineamientos técnicos.
  // Los upserts se gestionan vía flag 'synced' en cada tabla.
  if (accion !== "delete") return null;

  try {
    return await db.syncQueue.add({
      entidad: String(entidad || "").trim(),
      accion: String(accion || "").trim(),
      payload,
      createdAt: new Date().toISOString(),
      synced: 0,
    });
  } catch (error) {
    console.error("No se pudo encolar accion para sync futura:", error);
    return null;
  }
};

export const exportBackupData = async () => {
  const [productos, clientes, ventas, cajas, sesionesCaja] = await Promise.all([
    db.productos.toArray(),
    db.clientes.toArray(),
    db.ventas.toArray(),
    db.cajas ? db.cajas.toArray() : [],
    db.sesionesCaja ? db.sesionesCaja.toArray() : [],
  ]);

  return {
    app: "Tienda Nancy",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      productos,
      clientes,
      ventas,
      cajas,
      sesionesCaja,
    },
  };
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const sanitizeBackupProduct = (producto) => {
  const payload = { ...producto };
  payload.nombre = String(producto?.nombre || "").trim();
  payload.categoria = String(producto?.categoria || "").trim();
  payload.talles = String(producto?.talles || "").trim();
  payload.foto = producto?.foto || "";
  payload.detalles = String(producto?.detalles || "").trim();
  payload.precio = Math.max(0, Number(producto?.precio || 0));
  const codigo = String(producto?.codigo || "").trim();
  if (codigo) {
    payload.codigo = codigo;
  } else {
    payload.codigo = "779" + String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  }
  payload.remote_id = producto?.remote_id || crypto.randomUUID();
  payload.updated_at = producto?.updated_at || new Date().toISOString();
  payload.stock = sanitizeInt(producto?.stock, 0);
  payload.stock_minimo = sanitizeInt(producto?.stock_minimo, 3);
  return payload;
};

const sanitizeBackupClient = (cliente) => ({
  ...cliente,
  nombre: String(cliente?.nombre || "").trim(),
  telefono: String(cliente?.telefono || "").trim(),
  dni: String(cliente?.dni || "").trim(),
  deuda: Math.max(0, Number(cliente?.deuda || 0)),
  remote_id: cliente?.remote_id || crypto.randomUUID(),
  updated_at: cliente?.updated_at || new Date().toISOString(),
});

export const importBackupData = async (backup) => {
  if (!backup || typeof backup !== "object") {
    throw new Error("El archivo no contiene un backup valido.");
  }
  if (backup.app && backup.app !== "Tienda Nancy") {
    throw new Error("El backup no corresponde a esta aplicacion.");
  }
  const source = backup.data && typeof backup.data === "object" ? backup.data : backup;
  const productos = safeArray(source.productos);
  const clientes = safeArray(source.clientes);
  const ventas = safeArray(source.ventas);
  const cajas = safeArray(source.cajas);
  const sesionesCaja = safeArray(source.sesionesCaja);

  await db.transaction("rw", db.productos, db.clientes, db.ventas, db.cajas, db.sesionesCaja, async () => {
    if (productos.length) {
      const seen = new Set();
      const normalizados = productos.map((producto) => {
        const payload = sanitizeBackupProduct(producto);
        const codigo = payload.codigo || "";
        if (codigo) {
          let uniqueCodigo = codigo;
          let suffix = 1;
          while (seen.has(uniqueCodigo)) {
            suffix += 1;
            uniqueCodigo = `${codigo}-dup-${suffix}`;
          }
          seen.add(uniqueCodigo);
          payload.codigo = uniqueCodigo;
        } else {
          delete payload.codigo;
        }
        return payload;
      });
      await db.productos.bulkPut(normalizados);
    }
    if (clientes.length) await db.clientes.bulkPut(clientes.map(sanitizeBackupClient));
    if (ventas.length) await db.ventas.bulkPut(ventas);
    if (cajas.length && db.cajas) await db.cajas.bulkPut(cajas);
    if (sesionesCaja.length && db.sesionesCaja) await db.sesionesCaja.bulkPut(sesionesCaja);
  });

  await enqueueSyncAction("backup", "import", {
    productos: productos.length,
    clientes: clientes.length,
    ventas: ventas.length,
    cajas: cajas.length,
    sesionesCaja: sesionesCaja.length,
  });

  return {
    productos: productos.length,
    clientes: clientes.length,
    ventas: ventas.length,
    cajas: cajas.length,
    sesionesCaja: sesionesCaja.length,
  };
};

export const seedProductosDemo = async () => {
  const cantidad = await db.productos.count();

  if (cantidad > 0) {
    return;
  }

  await db.productos.bulkAdd([
    {
      codigo: "779100000001",
      nombre: "Blazer Sastrero",
      precio: 89990,
      categoria: "Abrigos",
      talles: "S, M, L",
      foto: "",
      detalles: "",
      stock: 10,
      stock_minimo: 3,
      remote_id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    },
    {
      codigo: "779100000002",
      nombre: "Jean Recto Premium",
      precio: 54990,
      categoria: "Denim",
      talles: "38, 40, 42, 44",
      foto: "",
      detalles: "",
      stock: 10,
      stock_minimo: 3,
      remote_id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    },
    {
      codigo: "779100000003",
      nombre: "Camisa Oxford",
      precio: 42990,
      categoria: "Camisas",
      talles: "S, M, L, XL",
      foto: "",
      detalles: "",
      stock: 10,
      stock_minimo: 3,
      remote_id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    },
  ]);
};

export const seedClientesDemo = async () => {
  const cantidad = await db.clientes.count();

  if (cantidad > 0) {
    return;
  }

  await db.clientes.bulkAdd([
    { nombre: "Carla Gomez", telefono: "5491134567890", deuda: 0, remote_id: crypto.randomUUID(), updated_at: new Date().toISOString(), synced: 0 },
    { nombre: "Luciana Perez", telefono: "5491176543210", deuda: 32500, remote_id: crypto.randomUUID(), updated_at: new Date().toISOString(), synced: 0 },
  ]);
};

export const clearCommercialHistory = async () => {
  await db.transaction("rw", db.ventas, db.clientes, db.cajas, db.sesionesCaja, async () => {
    await db.ventas.clear();
    await db.clientes.toCollection().modify((cliente) => {
      cliente.deuda = 0;
    });
    if (db.cajas) {
      await db.cajas.clear();
    }
    if (db.sesionesCaja) {
      await db.sesionesCaja.clear();
    }
  });

  await enqueueSyncAction("ventas", "clear-history", {
    clearedAt: new Date().toISOString(),
  });
};

export const clearBusinessData = async () => {
  try {
    const tablesToClear = [db.ventas, db.clientes, db.syncQueue];
    if (db.cajas) tablesToClear.push(db.cajas);
    if (db.sesionesCaja) tablesToClear.push(db.sesionesCaja);

    await db.transaction("rw", tablesToClear, async () => {
      await db.ventas.clear();
      await db.clientes.clear();
      if (db.cajas) await db.cajas.clear();
      if (db.sesionesCaja) await db.sesionesCaja.clear();
      if (db.syncQueue) await db.syncQueue.clear();
    });

    console.log("Datos de negocio limpiados con éxito. Recargando...");
    window.location.reload();
  } catch (error) {
    console.error("Error al limpiar datos de negocio:", error);
    throw error;
  }
};
