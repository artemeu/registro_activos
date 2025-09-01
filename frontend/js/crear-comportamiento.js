/**
 * Script para la página de creación de comportamientos.
 * Permite:
 *  - Seleccionar un activo principal
 *  - Definir si sube o baja
 *  - Elegir el efecto sobre otros activos
 *  - Enviar el comportamiento al backend para ser almacenado
 */

let activos = []; // Lista de activos cargada desde el backend

/**
 * Carga la lista de activos desde el backend y llena el select de activos principales.
 * Cada activo será una opción en el select 'activoPrincipal'.
 */
async function cargarActivos() {
  const res = await fetch('/api/activos'); // Petición al backend
  activos = await res.json(); // Guardamos los activos en la variable global

  const select = document.getElementById('activoPrincipal');
  // Creamos un <option> para cada activo
  activos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });
}
// Cargar activos al inicio
cargarActivos();

/**
 * Muestra dinámicamente los selects para definir el efecto sobre los demás activos.
 * - Se activa solo si hay un activo principal y un tipo de cambio seleccionado.
 * - Los otros activos pueden ser: "Sube", "Baja" o "Sin efecto".
 */
function mostrarImpactos() {
  const tipo = document.getElementById('tipoCambio').value; // "Sube" o "Baja" del principal
  const principal = document.getElementById('activoPrincipal').value; // Activo principal
  const impactosDiv = document.getElementById('impactos');
  impactosDiv.innerHTML = '';

  if (tipo && principal) {
    // Mostrar un select para cada activo distinto del principal
    activos.filter(a => a !== principal).forEach(a => {
      impactosDiv.innerHTML += `
        <div class="row mb-2">
          <div class="col-md-6">
            <span>${a}</span>
          </div>
          <div class="col-md-6">
            <select class="form-select impacto-efecto" data-activo="${a}">
              <option value="">Sin efecto</option>
              <option value="Sube">Sube</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>
      `;
    });
    document.getElementById('impactosContainer').style.display = 'block'; // Mostrar el contenedor
  } else {
    document.getElementById('impactosContainer').style.display = 'none'; // Ocultar si no hay selección
  }
}

// ========================
// Eventos para actualizar la UI
// ========================

// Cuando cambia el tipo de cambio, se muestran los impactos posibles
document.getElementById('tipoCambio').addEventListener('change', mostrarImpactos);

// Cuando cambia el activo principal, se reinician tipo de cambio, impactos y resumen
document.getElementById('activoPrincipal').addEventListener('change', () => {
  document.getElementById('tipoCambio').value = '';
  document.getElementById('impactos').innerHTML = '';
  document.getElementById('impactosContainer').style.display = 'none';
  document.getElementById('resumenPrincipal').innerHTML = '';
});

// ========================
// Resumen visual del activo principal
// ========================

document.getElementById('tipoCambio').addEventListener('change', function() {
  const principal = document.getElementById('activoPrincipal').value;
  const tipo = this.value;
  const resumen = document.getElementById('resumenPrincipal');
  if (principal && tipo) {
    // Mostrar activo principal y su tipo con un badge verde (Sube) o rojo (Baja)
    resumen.innerHTML = `<b>${principal}</b> <span class="badge bg-${tipo === 'Sube' ? 'success' : 'danger'}">${tipo}</span>`;
  } else {
    resumen.innerHTML = '';
  }
});

document.getElementById('activoPrincipal').addEventListener('change', function() {
  // Limpiar el resumen si cambia el activo principal
  document.getElementById('resumenPrincipal').innerHTML = '';
});

// ========================
// Envío del formulario al backend
// ========================

document.getElementById('formComportamiento').onsubmit = async (e) => {
  e.preventDefault(); // Evitar recarga de la página

  const evento = document.getElementById('evento').value.trim(); // Nombre del evento
  const activoPrincipal = document.getElementById('activoPrincipal').value; // Activo principal
  const tipoCambio = document.getElementById('tipoCambio').value; // "Sube" o "Baja"

  // ========================
  // Separar impactos en Sube y Baja
  // ========================
  const impactosSube = {};
  const impactosBaja = {};

  // Revisar cada select de efecto sobre otros activos
  document.querySelectorAll('.impacto-efecto').forEach(sel => {
    if (sel.value === 'Sube') {
      impactosSube[sel.dataset.activo] = 'Sube';
    } else if (sel.value === 'Baja') {
      impactosBaja[sel.dataset.activo] = 'Baja';
    }
  });

  // ========================
  // Construir objeto de datos para enviar al backend
  // ========================
  const datos = {
    evento,
    datos: {
      [activoPrincipal]: {
        tipoPrincipal: tipoCambio, // Estado del activo principal
        ...(Object.keys(impactosSube).length ? { Sube: impactosSube } : {}), // Solo incluir si hay subas
        ...(Object.keys(impactosBaja).length ? { Baja: impactosBaja } : {})   // Solo incluir si hay bajas
      }
    }
  };

  // ========================
  // Enviar al backend
  // ========================
  const res = await fetch('/api/comportamientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  const mensaje = document.getElementById('mensaje');
  if (res.ok) {
    // Mostrar mensaje de éxito y limpiar formulario
    mensaje.textContent = 'Comportamiento creado correctamente';
    mensaje.className = 'text-success';
    document.getElementById('formComportamiento').reset();
    document.getElementById('impactos').innerHTML = '';
    document.getElementById('impactosContainer').style.display = 'none';
    document.getElementById('resumenPrincipal').innerHTML = '';
  } else {
    // Mostrar mensaje de error si falla
    mensaje.textContent = 'Error al crear comportamiento';
    mensaje.className = 'text-danger';
  }
};
