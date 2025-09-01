/**
 * Script para la página de creación de comportamientos.
 * Permite seleccionar un activo principal, definir si sube o baja, y elegir el efecto sobre otros activos.
 */

let activos = [];

/**
 * Carga la lista de activos desde el backend y llena el select de activos principales.
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
 * Muestra los selects para elegir el efecto sobre los otros activos.
 */
function mostrarImpactos() {
  const tipo = document.getElementById('tipoCambio').value;
  const principal = document.getElementById('activoPrincipal').value;
  const impactosDiv = document.getElementById('impactos');
  impactosDiv.innerHTML = '';
  if (tipo && principal) {
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

// Eventos para reiniciar impactos y resumen
document.getElementById('tipoCambio').addEventListener('change', mostrarImpactos);
document.getElementById('activoPrincipal').addEventListener('change', () => {
  document.getElementById('tipoCambio').value = '';
  document.getElementById('impactos').innerHTML = '';
  document.getElementById('impactosContainer').style.display = 'none';
  document.getElementById('resumenPrincipal').innerHTML = '';
});

// Resumen visual del activo principal
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
 * Envía el comportamiento al backend separando correctamente Sube y Baja.
 */
document.getElementById('formComportamiento').onsubmit = async (e) => {
  e.preventDefault();
  const evento = document.getElementById('evento').value.trim();
  const activoPrincipal = document.getElementById('activoPrincipal').value;
  const tipoCambio = document.getElementById('tipoCambio').value;

  // Separar impactos en Sube y Baja
  const impactosSube = {};
  const impactosBaja = {};

  document.querySelectorAll('.impacto-efecto').forEach(sel => {
    if (sel.value === 'Sube') {
      impactosSube[sel.dataset.activo] = 'Sube';
    } else if (sel.value === 'Baja') {
      impactosBaja[sel.dataset.activo] = 'Baja';
    }
  });

  // Construir objeto de datos correctamente
  const datos = {
    evento,
    datos: {
      [activoPrincipal]: {
        tipoPrincipal: tipoCambio, // Estado del activo principal
        ...(Object.keys(impactosSube).length ? { Sube: impactosSube } : {}),
        ...(Object.keys(impactosBaja).length ? { Baja: impactosBaja } : {})
      }
    }
  };

  // Enviar al backend
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
