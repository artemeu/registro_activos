/**
 * Script principal para la página de simulador (index.html).
 * Permite seleccionar un activo, una hora (solo cada 30 minutos), un evento y registrar el cambio.
 * También muestra la tabla de historial de cambios.
 */

// =======================
// Variables globales
// =======================

// Lista de activos (criptomonedas) cargados desde el backend
let activos = [];
// Objeto con relaciones de comportamientos entre activos y eventos, cargado desde el backend
let COMPORTAMIENTOS = {};
// Objeto con el historial de cambios registrado (hora -> activo -> cambio), cargado desde el backend
let historial = {};

// =======================
// Funciones auxiliares
// =======================

/**
 * Crea un elemento <option> con el texto recibido para usar en <select>
 * @param {string} text - Texto a mostrar en la opción
 * @returns {HTMLOptionElement}
 */
function crearOption(text) {
  const o = document.createElement('option');
  o.text = text;
  return o;
}

/**
 * Llena los selects (dropdowns) del formulario con los datos actuales de activos y eventos.
 * Llama a esta función después de cargar activos y comportamientos.
 */
function llenarSelects() {
  const selectActivo = document.getElementById('activo');
  if (!selectActivo) return;
  selectActivo.innerHTML = '';
  activos.forEach(a => selectActivo.add(crearOption(a)));

  const selKw = document.getElementById('palabraClave');
  if (!selKw) return;
  selKw.innerHTML = '';
  const eventos = Object.keys(COMPORTAMIENTOS);
  eventos.forEach(p => selKw.add(crearOption(p)));
}

/**
 * Genera un array con las 48 medias horas (30 minutos) de un día completo,
 * partiendo desde la medianoche del día actual.
 * Formato ISO parcial: "YYYY-MM-DDTHH:mm"
 * @returns {string[]} Array de strings con las horas
 */
function generarHoras() {
  const horas = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Medianoche

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

// Guarda las 48 medias horas para reutilizar en la tabla y el select de horas
const todasLasHoras = generarHoras();

/**
 * Llena el select de horas con solo medias horas (cada 30 minutos).
 * Así el usuario solo puede elegir horarios válidos.
 */
function llenarHorasSelect() {
  const selectHora = document.getElementById('hora');
  if (!selectHora) return;
  selectHora.innerHTML = '';
  todasLasHoras.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h.slice(11, 16); // Solo muestra "HH:mm"
    selectHora.appendChild(opt);
  });
}

/**
 * Carga el historial completo desde el backend y renderiza la tabla.
 * Actualiza la variable global 'historial'.
 */
async function cargarDesdeServidor() {
  try {
    const res = await fetch('/api/historial');
    if (!res.ok) throw new Error(res.statusText);
    historial = await res.json();
    renderizarTabla();
  } catch (err) {
    console.error('Error cargando historial:', err);
    historial = {};
    renderizarTabla();
  }
}

/**
 * Registra un nuevo cambio (evento) con sus impactos relacionados,
 * enviando los datos al backend y actualizando el historial en la UI.
 * Se ejecuta al hacer clic en el botón de registrar.
 */
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

  // Obtiene valores ingresados por el usuario
  const activo = activoEl.value;
  const hora = horaEl.value;
  const palabraClave = palabraClaveEl.value;
  const cambio = cambioEl.value;

  // Valida que todos los campos estén completos
  if (!activo || !hora || !palabraClave || !cambio) {
    alert("Completa todos los campos.");
    return;
  }

  // Obtiene impactos relacionados (cambios en otros activos) según palabra clave, activo y tipo de cambio
  // Ejemplo: COMPORTAMIENTOS["Rumor"]["Bitcoin"]["Sube"] -> { "Ethereum": "Baja" }
  const impactos = COMPORTAMIENTOS[palabraClave]?.[activo]?.[cambio] || null;

  try {
    // Envía POST al backend para registrar el cambio y sus impactos
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora, activo, cambio, impactos })
    });
    if (!res.ok) throw new Error(await res.text());

    // Actualiza el historial con la respuesta del servidor
    const data = await res.json();
    historial = data.historial;
    renderizarTabla();
  } catch (err) {
    console.error('Error guardando registro:', err);
    alert('Error guardando registro en el servidor.');
  }
}

/**
 * Renderiza la tabla completa con el historial actual.
 * Muestra los activos como filas y las medias horas como columnas.
 * Usa flechas verdes para "Sube", rojas para "Baja" y vacío si no hay cambio.
 */
function renderizarTabla() {
  const container = document.getElementById("tablaContainer");
  if (!container) return;

  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = 'table table-striped table-bordered table-hover table-sm';

  // Cabecera con "Activo / Hora" y luego las 48 medias horas
  const thead = document.createElement('thead');
  const headerRow = document.createElement("tr");

  const th0 = document.createElement('th');
  th0.textContent = "Activo / Hora";
  th0.className = 'py-1 px-2 fs-6 text-nowrap';
  headerRow.appendChild(th0);

  // Crea una columna para cada media hora, mostrando solo la hora y minutos
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

/**
 * Carga datos iniciales: activos y comportamientos desde backend.
 * Luego llena los selects del formulario.
 */
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

// =======================
// Inicialización al cargar la página
// =======================

/**
 * Cuando el DOM esté listo, carga datos iniciales, historial y configura el botón para registrar eventos.
 * - Llena los selects de activos, eventos y horas.
 * - Carga el historial y lo muestra en la tabla.
 * - Asocia la función de registro al botón correspondiente.
 */
window.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosIniciales();  // Activos y comportamientos
  await cargarDesdeServidor();   // Historial para la tabla

  llenarHorasSelect(); // Llena el select de horas con medias horas

  // Asocia función al botón para registrar nuevos cambios
  const btnRegistrar = document.getElementById('btnRegistrar');
  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarConImpactosDesdeJson);
  }
});