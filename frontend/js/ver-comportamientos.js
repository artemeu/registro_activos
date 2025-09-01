/**
 * Genera listas de activos afectados (suben/bajan)
 */
function generarListaActivos(datos) {
  let html = '';

  if (datos.Sube && Object.keys(datos.Sube).length) {
    html += `<div class="mb-2">
               <strong class="text-success">Suben:</strong>
               <ul class="list-unstyled ms-3 mb-0">`;
    Object.keys(datos.Sube).forEach(activo => {
      html += `<li><span class="text-success">&#9650;</span> ${activo}</li>`;
    });
    html += `</ul></div>`;
  }

  if (datos.Baja && Object.keys(datos.Baja).length) {
    html += `<div class="mb-2">
               <strong class="text-danger">Bajan:</strong>
               <ul class="list-unstyled ms-3 mb-0">`;
    Object.keys(datos.Baja).forEach(activo => {
      html += `<li><span class="text-danger">&#9660;</span> ${activo}</li>`;
    });
    html += `</ul></div>`;
  }

  return html;
}

/**
 * Devuelve la flecha según el tipo (Sube/Baja)
 */
function flechaTipo(tipo) {
  if (!tipo) return '';
  return tipo.toLowerCase() === 'sube' ? `<span class="text-success">&#9650;</span>` : `<span class="text-danger">&#9660;</span>`;
}

/**
 * Carga todos los comportamientos y los muestra en cards
 */
async function cargarComportamientos() {
  const container = document.getElementById('comportamientosContainer');
  container.innerHTML = '<div class="text-center my-4">Cargando...</div>';

  try {
    const res = await fetch('/api/comportamientos');
    if (!res.ok) throw new Error('Error al cargar comportamientos');
    const comportamientos = await res.json();

    container.innerHTML = '';

    Object.entries(comportamientos).forEach(([evento, datosEvento]) => {
      const card = `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card shadow-sm h-100 border-0">
            <div class="card-body">
              <h5 class="card-title text-primary mb-3">${evento}</h5>
              ${Object.entries(datosEvento).map(([activoPrincipal, efectos]) => {
                const tipoPrincipal = efectos.tipoPrincipal || '';
                return `
                  <div class="mb-3">
                    <strong>Activo principal:</strong> ${activoPrincipal} ${flechaTipo(tipoPrincipal)}
                    ${generarListaActivos(efectos)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });

  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">No se pudo cargar la lista de comportamientos.</div>`;
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', cargarComportamientos);
