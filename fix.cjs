const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');
const target = '      scheduleAutoSync();\n      setMensaje("El monto de apertura no puede ser negativo.");\n      return;\n    }';
const replacement = `      scheduleAutoSync();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    }
  };

  const handleDeleteVenta = async (id) => {
    if (!window.confirm("¿Borrar esta venta del historial? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarVenta(id);
      setMensaje("Venta eliminada del historial.");
    } catch (err) {
      setMensaje(err.message || "No se pudo eliminar la venta.");
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
    }`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/App.jsx', content, 'utf-8');
    console.log('Replaced successfully');
} else {
    console.log('Target not found');
}
