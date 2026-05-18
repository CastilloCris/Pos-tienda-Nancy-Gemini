const fs = require('fs');

let appContent = fs.readFileSync('src/App.jsx', 'utf8');

appContent = appContent.replace(
  'const [clienteForm, setClienteForm] = useState({ nombre: "", telefono: "", dni: "", email: "" });',
  'const [clienteForm, setClienteForm] = useState({ nombre: "", telefono: "", dni: "", email: "", deudaInicial: "" });'
);

appContent = appContent.replace(
  'setClienteForm({ nombre: "", telefono: "", dni: "" });',
  'setClienteForm({ nombre: "", telefono: "", dni: "", deudaInicial: "" });'
);

// We need to replace the exact add code
const saveTarget = `    } else {
      const remote_id = generateUUID();
      const id = await db.clientes.add({ ...payload, deuda: 0, remote_id });
      setMensaje(\`"\${payload.nombre}" agregado a clientes.\`);
    }`;

const saveReplacement = `    } else {
      const remote_id = generateUUID();
      const deudaInit = Math.round(Number(clienteForm.deudaInicial || 0) * 100) / 100;
      const id = await db.clientes.add({ ...payload, deuda: deudaInit > 0 ? deudaInit : 0, remote_id });
      setMensaje(\`"\${payload.nombre}" agregado a clientes.\`);
    }`;

if (appContent.includes(saveTarget)) {
  appContent = appContent.replace(saveTarget, saveReplacement);
} else if (appContent.includes(saveTarget.replace(/\n/g, '\r\n'))) {
  appContent = appContent.replace(saveTarget.replace(/\n/g, '\r\n'), saveReplacement);
}

fs.writeFileSync('src/App.jsx', appContent, 'utf8');


let sectionContent = fs.readFileSync('src/components/pos/Sections.jsx', 'utf8');

const sectionTarget = `          <input type="text" placeholder="DNI (Opcional)" className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={clienteForm.dni || ""} onChange={(e) => setClienteForm({ ...clienteForm, dni: e.target.value })} />
        </div>`;

const sectionReplacement = `          <input type="text" placeholder="DNI (Opcional)" className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={clienteForm.dni || ""} onChange={(e) => setClienteForm({ ...clienteForm, dni: e.target.value })} />
          {!clienteEditando && (
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Deuda inicial (opcional)"
              className="w-full rounded-xl border border-gray-700 bg-gray-900/50 p-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={clienteForm.deudaInicial || ""}
              onChange={(e) => setClienteForm({ ...clienteForm, deudaInicial: e.target.value })}
            />
          )}
        </div>`;

if (sectionContent.includes(sectionTarget)) {
  sectionContent = sectionContent.replace(sectionTarget, sectionReplacement);
} else if (sectionContent.includes(sectionTarget.replace(/\n/g, '\r\n'))) {
  sectionContent = sectionContent.replace(sectionTarget.replace(/\n/g, '\r\n'), sectionReplacement);
}

fs.writeFileSync('src/components/pos/Sections.jsx', sectionContent, 'utf8');
console.log('DONE');
