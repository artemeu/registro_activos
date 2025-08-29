/**
 * Script para la página de creación de activos.
 * Permite al usuario ingresar el nombre de un nuevo activo y lo envía al backend para guardarlo en la base de datos.
 */

// Espera a que el usuario envíe el formulario de creación de activo
document.getElementById('formActivo').addEventListener('submit', async (e) => {
  e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)

  // Obtiene el valor ingresado por el usuario en el campo de nombre
  const nombre = document.getElementById('nombreActivo').value.trim();
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = '';

  // Valida que el campo no esté vacío
  if (!nombre) {
    mensaje.textContent = 'Debes ingresar un nombre para el activo.';
    mensaje.className = 'text-danger';
    return;
  }

  // Envía una petición POST al backend para crear el nuevo activo
  // El backend espera un objeto { nombre: "NombreActivo" }
  const res = await fetch('/api/activos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });

  // Muestra un mensaje según el resultado de la petición
  if (res.ok) {
    mensaje.textContent = 'Activo creado correctamente';
    mensaje.className = 'text-success';
    document.getElementById('formActivo').reset(); // Limpia el formulario
  } else {
    mensaje.textContent = 'Error al crear activo';
    mensaje.className = 'text-danger';
  }
});