// frontend/script.js

// Variables globales que almacenan datos cargados desde el servidor
let activos = [];           // Lista de activos (criptomonedas)
let COMPORTAMIENTOS = {};   // Objeto con relaciones de comportamientos entre activos y eventos
let historial = {};         // Objeto con el historial de cambios registrado (hora -> activo -> cambio)

// Crea un elemento <option> con el texto recibido para usar en <select>
function crearOption(text) {
  const o = document.createElement('option');
  o.text = text;
  return o;
}

// Llena los selects (dropdowns) del formulario con los datos actuales
function llenarSelects() {
  const selectActivo = document.getElementById('activo');
  if (!selectActivo) return;
  selectActivo.innerHTML = '';         // Limpia opciones previas
  activos.forEach(a => selectActivo.add(crearOption(a)));  // Agrega cada activo como opción

  const selKw = document.getElementById('palabraClave');
  if (!selKw) return;
  selKw.innerHTML = '';                 // Limpia opciones previas
  const eventos = Object.keys(COMPORTAMIENTOS);  // Obtiene claves principales (eventos)
  eventos.forEach(p => selKw.add(crearOption(p))); // Agrega cada evento como opción
}

// Función para cargar el historial completo desde el backend y renderizar la tabla
async function cargarDesdeServidor() {
  try {
    const res = await fetch('/api/historial');  // Llama API para historial
    if (!res.ok) throw new Error(res.statusText);
    historial = await res.json();                // Guarda el historial global
    renderizarTabla();                           // Actualiza tabla en pantalla
  } catch (err) {
    console.error('Error cargando historial:', err);
    historial = {};                              // Vacía historial si error
    renderizarTabla();                           // Renderiza tabla vacía
  }
}

// Función que registra un nuevo cambio (evento) con sus impactos relacionados,
// enviando los datos al backend y actualizando el historial en la UI
async function registrarConImpactosDesdeJson() {
  // Obtiene elementos del formulario
  const activoEl = document.getElementById("activo");
  const horaEl = document.getElementById("hora");
  const palabraClaveEl = document.getElementById("palabraClave");
  const cambioEl = document.getElementById("cambio");

  // Valida existencia de elementos
  if (!activoEl || !horaEl || !palabraClaveEl || !cambioEl) {
    alert("Elementos del formulario no encontrados");
    return;
  }

  // Obtiene valores ingresados
  const activo = activoEl.value;
  const hora = horaEl.value;
  const palabraClave = palabraClaveEl.value;
  const cambio = cambioEl.value;

  // Valida que estén completos
  if (!activo || !hora || !palabraClave || !cambio) {
    alert("Completa todos los campos.");
    return;
  }

  // Obtiene impactos relacionados (cambios en otros activos) según palabra clave, activo y tipo de cambio
  const impactos = COMPORTAMIENTOS[palabraClave]?.[activo]?.[cambio] || null;

  try {
    // Envia POST al backend para registrar el cambio y sus impactos
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora, activo, cambio, impactos })
    });
    if (!res.ok) throw new Error(await res.text());

    // Actualiza el historial con la respuesta del servidor
    const data = await res.json();
    historial = data.historial;
    renderizarTabla();  // Vuelve a renderizar la tabla para mostrar cambios
  } catch (err) {
    console.error('Error guardando registro:', err);
    alert('Error guardando registro en el servidor.');
  }
}

// Genera un array con las 48 medias horas (30 minutos) de un día completo,
// partiendo desde la medianoche del día actual.
// Formato ISO parcial: "YYYY-MM-DDTHH:mm"
function generarHoras() {
  const horas = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Establece a medianoche

  for (let i = 0; i < 48; i++) {
    const hora = new Date(start.getTime() + i * 30 * 60000);
    const yy = hora.getFullYear();
    const mm = String(hora.getMonth() + 1).padStart(2, '0');
    const dd = String(hora.getDate()).padStart(2, '0');
    const hh = String(hora.getHours()).padStart(2, '0');
    const min = String(hora.getMinutes()).padStart(2, '0');
    horas.push(`${yy}-${mm}-${dd}T${hh}:${min}`);
  }

  return horas;
}

// Guarda las 48 medias horas para reutilizar en la tabla
const todasLasHoras = generarHoras();

// Función para renderizar la tabla completa con el historial actual
function renderizarTabla() {
  const container = document.getElementById("tablaContainer");
  if (!container) return;

  container.innerHTML = "";  // Limpia contenido previo

  const table = document.createElement("table");
  table.className = 'table table-striped table-bordered table-hover table-sm';

  // Cabecera con "Activo / Hora" y luego las 48 medias horas
  const thead = document.createElement('thead');
  const headerRow = document.createElement("tr");

  const th0 = document.createElement('th');
  th0.textContent = "Activo / Hora";
  th0.className = 'py-1 px-2 fs-6 text-nowrap';
  headerRow.appendChild(th0);

  todasLasHoras.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h.slice(11, 16);  // Solo muestra "HH:mm"
    th.className = 'py-1 px-2 fs-6 text-nowrap';
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Cuerpo de tabla: filas con activos y sus cambios por media hora
  const tbody = document.createElement('tbody');

  activos.forEach(activo => {
    const row = document.createElement("tr");

    // Columna con nombre del activo
    const tdActivo = document.createElement('td');
    tdActivo.textContent = activo;
    tdActivo.className = 'py-1 px-2 fs-6 text-nowrap';
    row.appendChild(tdActivo);

    // Columnas con flechas según cambio (Sube / Baja / sin cambio)
    todasLasHoras.forEach(h => {
      const td = document.createElement('td');
      const cambio = historial[h]?.[activo] || "";
      const flecha = cambio === "Sube"
        ? "<span class='text-success'>&#9650;</span>"  // Flecha arriba verde
        : cambio === "Baja"
          ? "<span class='text-danger'>&#9660;</span>" // Flecha abajo roja
          : "";                                        // Vacío si sin cambio
      td.innerHTML = flecha;
      td.className = 'py-1 px-2 fs-6 text-nowrap text-center align-middle';
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Función que carga datos iniciales: activos y comportamientos desde backend
async function cargarDatosIniciales() {
  try {
    // Carga activos
    const resActivos = await fetch('/api/activos');
    if (!resActivos.ok) throw new Error('Error cargando activos');
    activos = await resActivos.json();

    // Carga comportamientos
    const resComport = await fetch('/api/comportamientos');
    if (!resComport.ok) throw new Error('Error cargando comportamientos');
    COMPORTAMIENTOS = await resComport.json();

    // Llena los selects del formulario con los datos recibidos
    llenarSelects();

  } catch (e) {
    alert('Error cargando datos iniciales desde servidor: ' + e.message);
    activos = [];
    COMPORTAMIENTOS = {};
    llenarSelects();
  }
}

// Cuando el DOM esté listo, carga datos iniciales, historial y configura el botón para registrar eventos
window.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosIniciales();  // Activos y comportamientos
  await cargarDesdeServidor();   // Historial para la tabla

  // Asocia función al botón para registrar nuevos cambios
  const btnRegistrar = document.getElementById('btnRegistrar');
  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarConImpactosDesdeJson);
  }
});
