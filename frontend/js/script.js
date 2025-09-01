/**
 * Script principal para la página de simulador (index.html).
 * Permite:
 *  - Seleccionar un activo, una hora (solo cada 30 minutos), un evento y registrar el cambio.
 *  - Mostrar una tabla de historial de cambios con flechas verdes (sube) o rojas (baja).
 *  - Aplicar automáticamente los impactos relacionados según el comportamiento seleccionado.
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
 * Llena los selects del formulario con los datos actuales de activos y eventos.
 * - Activos: se cargan en el select de "activo"
 * - Eventos: se cargan en el select de "palabraClave" a partir de COMPORTAMIENTOS
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
 * Genera un array con las 48 medias horas (cada 30 minutos) de un día completo.
 * Formato ISO parcial: "YYYY-MM-DDTHH:mm"
 * Esto se usa para:
 *  - Llenar el select de horas
 *  - Generar las columnas de la tabla de historial
 * @returns {string[]} Array de strings con las horas
 */
function generarHoras() {
  const horas = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Empieza a medianoche

  for (let i = 0; i < 48; i++) {
    const hora = new Date(start.getTime() + i * 30 * 60000); // Cada 30 min
    const yy = hora.getFullYear();
    const mm = String(hora.getMonth() + 1).padStart(2, '0');
    const dd = String(hora.getDate()).padStart(2, '0');
    const hh = String(hora.getHours()).padStart(2, '0');
    const min = String(hora.getMinutes()).padStart(2, '0');
    horas.push(`${yy}-${mm}-${dd}T${hh}:${min}`);
  }

  return horas;
}

// Guardamos las 48 medias horas para reutilizar en la tabla y el select de horas
const todasLasHoras = generarHoras();

/**
 * Llena el select de horas con solo medias horas.
 * Así el usuario solo puede elegir horarios válidos.
 */
function llenarHorasSelect() {
  const selectHora = document.getElementById('hora');
  if (!selectHora) return;
  selectHora.innerHTML = '';
  todasLasHoras.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h.slice(11, 16); // Solo "HH:mm" para mostrar en el select
    selectHora.appendChild(opt);
  });
}

/**
 * Carga el historial completo desde el backend.
 * Actualiza la variable global 'historial' y renderiza la tabla de historial.
 */
async function cargarDesdeServidor() {
  try {
    const res = await fetch('/api/historial');
    if (!res.ok) throw new Error(res.statusText);
    historial = await res.json(); // historial[hora][activo] = 'Sube' | 'Baja'
    renderizarTabla();
  } catch (err) {
    console.error('Error cargando historial:', err);
    historial = {};
    renderizarTabla();
  }
}

/**
 * Registra un nuevo cambio en el sistema, aplicando impactos del comportamiento.
 * Envía al backend un objeto con todos los cambios: activo principal + impactos relacionados.
 */
async function registrarConImpactosDesdeJson() {
  const activoEl = document.getElementById("activo");
  const horaEl = document.getElementById("hora");
  const palabraClaveEl = document.getElementById("palabraClave");
  const cambioEl = document.getElementById("cambio");

  if (!activoEl || !horaEl || !palabraClaveEl || !cambioEl) {
    alert("Elementos del formulario no encontrados");
    return;
  }

  const activo = activoEl.value;           // Activo principal seleccionado
  const hora = horaEl.value;               // Hora seleccionada
  const palabraClave = palabraClaveEl.value; // Evento/comportamiento seleccionado
  const cambio = cambioEl.value;           // "Sube" o "Baja"

  if (!activo || !hora || !palabraClave || !cambio) {
    alert("Completa todos los campos.");
    return;
  }

  // ========================
  // Obtenemos los impactos según el comportamiento seleccionado
  // - COMPORTAMIENTOS[evento][activo] = { tipoPrincipal, Sube: {...}, Baja: {...} }
  // - Se combinan todas las subas y bajas para enviarlas al backend
  // ========================
  const comportamiento = COMPORTAMIENTOS[palabraClave]?.[activo] || {};
  const impactos = { ...comportamiento.Sube, ...comportamiento.Baja }; // Todos los activos afectados
  const cambios = { [activo]: cambio, ...impactos };                   // Incluye activo principal

  try {
    const res = await fetch('/api/historial/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora, cambios })
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    // Actualiza la variable global con el historial completo retornado por el backend
    historial = data.historial;

    renderizarTabla();
  } catch (err) {
    console.error('Error guardando registro:', err);
    alert('Error guardando registro en el servidor.');
  }
}

/**
 * Renderiza la tabla completa con el historial actual.
 * - Filas: activos
 * - Columnas: medias horas
 * - Flechas verdes = "Sube", rojas = "Baja", vacío si no hay cambio
 */
function renderizarTabla() {
  const container = document.getElementById("tablaContainer");
  if (!container) return;

  container.innerHTML = "";
  const table = document.createElement("table");
  table.className = 'table table-striped table-bordered table-hover table-sm';

  // ========================
  // Cabecera: primera columna = Activo / Hora, resto = medias horas
  // ========================
  const thead = document.createElement('thead');
  const headerRow = document.createElement("tr");
  const th0 = document.createElement('th');
  th0.textContent = "Activo / Hora";
  th0.className = 'py-1 px-2 fs-6 text-nowrap';
  headerRow.appendChild(th0);

  todasLasHoras.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h.slice(11, 16); // Solo HH:mm
    th.className = 'py-1 px-2 fs-6 text-nowrap';
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // ========================
  // Cuerpo de la tabla
  // Cada fila = un activo
  // Cada columna = estado del activo a esa hora ("Sube", "Baja", "")
  // ========================
  const tbody = document.createElement('tbody');
  activos.forEach(activo => {
    const row = document.createElement("tr");

    // Columna con el nombre del activo
    const tdActivo = document.createElement('td');
    tdActivo.textContent = activo;
    tdActivo.className = 'py-1 px-2 fs-6 text-nowrap';
    row.appendChild(tdActivo);

    // Columnas con flechas según el historial
    todasLasHoras.forEach(h => {
      const td = document.createElement('td');
      const cambio = historial[h]?.[activo] || "";
      const flecha = cambio === "Sube"
        ? "<span class='text-success'>&#9650;</span>"
        : cambio === "Baja"
          ? "<span class='text-danger'>&#9660;</span>"
          : "";
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
 * Carga datos iniciales desde el backend: activos y comportamientos.
 * Luego llena los selects del formulario.
 */
async function cargarDatosIniciales() {
  try {
    const resActivos = await fetch('/api/activos');
    if (!resActivos.ok) throw new Error('Error cargando activos');
    activos = await resActivos.json();

    const resComport = await fetch('/api/comportamientos');
    if (!resComport.ok) throw new Error('Error cargando comportamientos');
    COMPORTAMIENTOS = await resComport.json();

    // Llenar selects con los datos cargados
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
window.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosIniciales();  // Carga activos y comportamientos
  await cargarDesdeServidor();   // Carga historial y renderiza la tabla
  llenarHorasSelect();           // Llena el select de horas

  // Asociamos la función de registro al botón "Registrar"
  const btnRegistrar = document.getElementById('btnRegistrar');
  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', registrarConImpactosDesdeJson);
  }
});
