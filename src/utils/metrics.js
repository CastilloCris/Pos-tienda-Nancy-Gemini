/**
 * @fileoverview Métricas y cálculos del Dashboard Offline-First
 * Estas funciones procesan directamente arrays de datos descargados de Dexie
 * para no saturar al base de datos ni depender de Supabase Remote RPCs.
 */

/**
 * Calcula el resumen de ventas (Hoy y Este Mes)
 * @param {Array} ventas - Arreglo con todo el historial local de ventas
 * @returns {Object} { ventasHoy, totalHoy, ventasMes, totalMes }
 */
export const getSalesSummary = (ventas) => {
    if (!ventas || ventas.length === 0) {
        return { ventasHoy: 0, totalHoy: 0, ventasMes: 0, totalMes: 0 };
    }

    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const mesActualStr = hoyStr.slice(0, 7); // YYYY-MM

    let ventasHoy = 0;
    let totalHoy = 0;
    let ventasMes = 0;
    let totalMes = 0;

    ventas.forEach(v => {
        // Asume que la fecha guardada es formato ISO "YYYY-MM-DDTHH:mm:ss.sssZ" o al menos empieza con fecha
        const ventaFechaStr = (v.fechaClave || v.fecha || "").slice(0, 10);
        const ventaMesStr = ventaFechaStr.slice(0, 7);
        const total = Number(v.total) || 0;

        if (ventaFechaStr === hoyStr) {
            ventasHoy++;
            totalHoy += total;
        }

        if (ventaMesStr === mesActualStr) {
            ventasMes++;
            totalMes += total;
        }
    });

    return { ventasHoy, totalHoy, ventasMes, totalMes };
};

/**
 * Encuentra productos con stock por debajo de su mínimo
 * @param {Array} productos - Arreglo de inventario
 * @param {number} defaultMin - Stock mínimo por defecto si el producto no tiene uno configurado
 * @returns {Array} Lista de productos en riesgo ordenados de menor a mayor cantidad
 */
export const getLowStockProducts = (productos, defaultMin = 3) => {
    if (!productos) return [];

    return productos
        .filter(p => {
            const currentStock = Number(p.stock) || 0;  // Campo correcto en Dexie
            const minStock = Number(p.stock_minimo) || defaultMin; // stock_minimo viene del schema (default 3)
            return currentStock <= minStock;
        })
        .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
};

/**
 * Retorna lista y sumatoria de clientes que deben dinero
 * @param {Array} clientes 
 * @returns {Object} { morosos: Array, cantidad: number, totalDeuda: number }
 */
export const getCustomersWithDebt = (clientes) => {
    if (!clientes) return { morosos: [], cantidad: 0, totalDeuda: 0 };

    const morosos = clientes.filter(c => Number(c.deuda) > 0);
    const totalDeuda = morosos.reduce((acc, c) => acc + Number(c.deuda), 0);

    return {
        morosos: morosos.sort((a, b) => Number(b.deuda) - Number(a.deuda)), // Order descending
        cantidad: morosos.length,
        totalDeuda
    };
};

/**
 * Devuelve el Top N productos más vendidos en un histórico de ventas indicado
 * @param {Array} ventas 
 * @param {number} top - Cantidad de items a retornar
 * @returns {Array} Array de objetos { nombre, foto, cantidad_vendida, ingresos_generados }
 */
export const getTopSellingProducts = (ventas, top = 5) => {
    if (!ventas || ventas.length === 0) return [];

    const productStats = {}; // Map { "ID_Nombre": { nombre, cantidad, ingresos } }

    ventas.forEach(v => {
        if (!v.articulos) return;
        
        v.articulos.forEach(art => {
            // Usamos el código o nombre como llave principal, por si eliminaron el ID producto original
            const key = art.codigo || art.nombre || "Desconocido";
            
            if (!productStats[key]) {
                productStats[key] = {
                    codigo: art.codigo || "",
                    nombre: art.nombre || "Item sin nombre",
                    categoria: art.categoria || "",
                    foto: art.foto || null,
                    cantidad_vendida: 0,
                    ingresos_generados: 0
                };
            }

            productStats[key].cantidad_vendida += (Number(art.cantidad) || 1);
            // El ingreso neto sumando es la cantidad x el precio asignado en ESE ticket al concretarlo
            productStats[key].ingresos_generados += ((Number(art.precio) || 0) * (Number(art.cantidad) || 1));
        });
    });

    // Convert to array and sort by quantity descending
    const sorted = Object.values(productStats).sort((a, b) => b.cantidad_vendida - a.cantidad_vendida);
    
    return sorted.slice(0, top);
};

/**
 * Cuenta cuántas ventas están encoladas y no sincronizadas con la nube.
 * @param {Array} ventas 
 * @returns {Object} { conteo: number, fallidas: number }
 */
export const getPendingSyncCount = (ventas) => {
    if (!ventas) return { conteo: 0, fallidas: 0 };
    
    let conteo = 0;
    let fallidas = 0;

    ventas.forEach(v => {
        if (v.sync_status === "failed") {
            conteo++;
            fallidas++;
        } else if (v.synced === 0 || v.synced === undefined || v.synced === null) {
            conteo++;
        }
    });

    return { conteo, fallidas };
};
