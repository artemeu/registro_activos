/**
 * Script para la página de creación de comportamientos.
 * Permite seleccionar un activo principal, definir si sube o baja, y elegir el efecto sobre otros activos.
 */

let activos = [];

/**
 * Carga la lista de activos desde el backend y llena el select de activos principales.
 * Esto permite que el usuario elija sobre qué activo principal crear el comportamiento.
 */
async function cargarActivos() {
  const res = await fetch('/api/activos');
  activos = await res.json();
  const select = document.getElementById('activoPrincipal');
  activos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });
}
cargarActivos();

/**
 * Muestra los selects para elegir el efecto sobre los otros activos,
 * solo después de seleccionar el activo principal y si sube o baja.
 * Por cada activo distinto al principal, permite elegir si "Sube", "Baja" o "Sin efecto".
 */
function mostrarImpactos() {
  const tipo = document.getElementById('tipoCambio').value;
  const principal = document.getElementById('activoPrincipal').value;
  const impactosDiv = document.getElementById('impactos');
  impactosDiv.innerHTML = '';
  if (tipo && principal) {
    // Muestra solo los activos distintos al principal
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
    document.getElementById('impactosContainer').style.display = 'block';
  } else {
    document.getElementById('impactosContainer').style.display = 'none';
  }
}

// Reinicia los impactos y el resumen si cambia el activo principal
document.getElementById('tipoCambio').addEventListener('change', mostrarImpactos);
document.getElementById('activoPrincipal').addEventListener('change', () => {
  document.getElementById('tipoCambio').value = '';
  document.getElementById('impactos').innerHTML = '';
  document.getElementById('impactosContainer').style.display = 'none';
  document.getElementById('resumenPrincipal').innerHTML = '';
});

// Muestra un resumen visual del activo principal y su efecto (sube/baja)
document.getElementById('tipoCambio').addEventListener('change', function() {
  const principal = document.getElementById('activoPrincipal').value;
  const tipo = this.value;
  const resumen = document.getElementById('resumenPrincipal');
  if (principal && tipo) {
    resumen.innerHTML = `<b>${principal}</b> <span class="badge bg-${tipo === 'Sube' ? 'success' : 'danger'}">${tipo}</span>`;
  } else {
    resumen.innerHTML = '';
  }
});
document.getElementById('activoPrincipal').addEventListener('change', function() {
  document.getElementById('resumenPrincipal').innerHTML = '';
});

/**
 * Envía el comportamiento creado al backend cuando se envía el formulario.
 * Construye el objeto de datos con el evento, el activo principal, el tipo de cambio y los impactos.
 * Si la petición es exitosa, muestra un mensaje y resetea el formulario.
 */
document.getElementById('formComportamiento').onsubmit = async (e) => {
  e.preventDefault();
  const evento = document.getElementById('evento').value.trim();
  const activoPrincipal = document.getElementById('activoPrincipal').value;
  const tipoCambio = document.getElementById('tipoCambio').value;

  // Obtiene los activos afectados y su efecto
  const impactos = {};
  document.querySelectorAll('.impacto-efecto').forEach(sel => {
    if (sel.value) {
      impactos[sel.dataset.activo] = sel.value;
    }
  });

  // Construye el objeto de datos para enviar al backend
  // Estructura: { evento, datos: { [activoPrincipal]: { [tipoCambio]: { ...impactos } } } }
  const datos = {
    evento,
    datos: {
      [activoPrincipal]: {
        [tipoCambio]: impactos
      }
    }
  };

  // Envía la petición POST al backend
  const res = await fetch('/api/comportamientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const mensaje = document.getElementById('mensaje');
  if (res.ok) {
    mensaje.textContent = 'Comportamiento creado correctamente';
    mensaje.className = 'text-success';
    document.getElementById('formComportamiento').reset();
    document.getElementById('impactos').innerHTML = '';
    document.getElementById('impactosContainer').style.display = 'none';
    document.getElementById('resumenPrincipal').innerHTML = '';
  } else {
    mensaje.textContent = 'Error al crear comportamiento';
    mensaje.className = 'text-danger';
  }
};