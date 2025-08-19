// frontend/historial.js

// Variable global que guarda todo el historial descargado desde el servidor
let historialGlobal = {};
// Lista global de activos (criptomonedas, etc.)
let activos = [];

/**
 * Genera un array con las 48 medias horas (intervalos de 30 minutos) de un día,
 * tomando como base la fecha pasada en formato "YYYY-MM-DD".
 * Si no se pasa fecha, usa el día actual.
 * Devuelve un array con strings tipo "YYYY-MM-DDTHH:mm".
 */
const generarHoras = (fechaFiltro = null) => {
  const horas = [];
  let start;
  if (fechaFiltro) {
    // Si hay fecha, crea objeto Date en la medianoche de ese día
    const [y, m, d] = fechaFiltro.split("-");
    start = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    // Si no, crea Date para medianoche del día actual
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }

  // Genera 48 timestamps separados por 30 minutos
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
};

/**
 * Filtra un objeto historial para devolver solo las entradas cuyo key (hora)
 * comienza con la fecha dada.
 * 
 * @param {Object} historial - El historial completo (objeto)
 * @param {String} fecha - Fecha en formato "YYYY-MM-DD"
 * @returns {Object} - Subobjeto filtrado del historial
 */
function filtrarPorFecha(historial, fecha) {
  if (!fecha) return historial;

  const resultado = {};
  // Recorre las entradas del historial
  Object.entries(historial).forEach(([key, val]) => {
    // Si la key (hora) comienza con la fecha dada, la incluye
    if (key.startsWith(fecha)) resultado[key] = val;
  });
  return resultado;
}

/**
 * Renderiza una tabla HTML con los datos del historial filtrado.
 * Cada fila representa un activo, cada columna un intervalo de media hora.
 * Se muestran flechas verdes para "Sube", rojas para "Baja" y vacío si no hay cambio.
 * 
 * @param {Object} hist - Historial filtrado para mostrar
 * @param {String} containerId - ID del contenedor donde insertar la tabla (default: 'histContainer')
 */
function renderFromData(hist, containerId = 'histContainer') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';  // Limpia contenido previo

  const table = document.createElement('table');
  table.className = 'table table-striped table-bordered table-hover table-sm';

  // Crea encabezado de tabla
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const th0 = document.createElement('th');
  th0.textContent = 'Activo / Hora';
  th0.className = 'py-1 px-2 fs-6 text-nowrap';
  headerRow.appendChild(th0);

  // Obtiene la fecha seleccionada para generar las columnas de horas
  const fechaFiltro = document.getElementById('fechaFiltro').value;
  const horas = generarHoras(fechaFiltro);

  // Crea una columna para cada media hora, mostrando solo la hora y minutos
  horas.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h.slice(11, 16);
    th.className = 'py-1 px-2 fs-6 text-nowrap';
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Crea cuerpo de la tabla
  const tbody = document.createElement('tbody');

  // Por cada activo, crea una fila con su nombre y sus cambios por hora
  activos.forEach(activo => {
    const row = document.createElement('tr');

    const tdActivo = document.createElement('td');
    tdActivo.textContent = activo;
    tdActivo.className = 'py-1 px-2 fs-6 text-nowrap';
    row.appendChild(tdActivo);

    // Para cada hora, muestra una flecha verde si sube, roja si baja, vacío si nada
    horas.forEach(h => {
      const td = document.createElement('td');
      const change = hist[h]?.[activo] || '';
      const flecha = change === 'Sube' ? "<span class='text-success'>&#9650;</span>" :
        change === 'Baja' ? "<span class='text-danger'>&#9660;</span>" : '';
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
 * Función que carga la lista de activos desde el backend.
 * Actualiza la variable global 'activos'.
 */
async function cargarActivos() {
  try {
    const res = await fetch('/api/activos');
    if (!res.ok) throw new Error('Error cargando activos');
    activos = await res.json();
  } catch (e) {
    alert('Error cargando activos desde servidor');
    activos = [];
  }
}

/**
 * Función que carga el historial completo desde el backend,
 * actualiza la variable global y luego renderiza la tabla filtrada.
 */
async function cargarHistorialServidor() {
  try {
    const res = await fetch('/api/historial');
    if (!res.ok) throw new Error('Error en servidor');
    historialGlobal = await res.json();
    aplicarFiltroYRenderear();
  } catch (e) {
    alert('Error cargando historial desde servidor');
  }
}

/**
 * Función que llama a cargar activos y luego cargar historial,
 * para tener ambos datos sincronizados y luego mostrar la tabla.
 */
async function cargarDatosYHistorial() {
  await cargarActivos();
  await cargarHistorialServidor();
}

/**
 * Filtra el historial global según la fecha seleccionada
 * y llama a la función que renderiza la tabla.
 */
function aplicarFiltroYRenderear() {
  const fecha = document.getElementById('fechaFiltro').value;
  if (!historialGlobal || Object.keys(historialGlobal).length === 0) {
    // Si no hay datos, no hace nada
    return;
  }
  const filtrado = filtrarPorFecha(historialGlobal, fecha);
  renderFromData(filtrado);
}

// Configura los eventos cuando el DOM ya está cargado
document.addEventListener('DOMContentLoaded', () => {
  // Botón para cargar datos desde servidor
  const btnCargar = document.getElementById('btnCargarServidor');
  // Input para seleccionar fecha para filtrar
  const inputFecha = document.getElementById('fechaFiltro');

  if (btnCargar) btnCargar.addEventListener('click', cargarDatosYHistorial);
  if (inputFecha) inputFecha.addEventListener('change', aplicarFiltroYRenderear);
});
