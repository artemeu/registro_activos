import { getDB } from '../mongo.js';

/**
 * GET /api/comportamientos
 * 
 * Función que obtiene todos los comportamientos/eventos desde la base de datos.
 * - Conecta a la base de datos MongoDB.
 * - Consulta todos los documentos de la colección 'comportamientos'.
 * - Construye un objeto donde cada clave es el nombre del evento y el valor son los datos asociados.
 * 
 * Ejemplo de respuesta JSON:
 * {
 *   "Rumor": { "Bitcoin": { "tipoPrincipal": "Sube", "Sube": {...}, "Baja": {...} } },
 *   "Noticia": { ... }
 * }
 */
export async function getComportamientos(req, res) {
    try {
        // Obtener la instancia de la base de datos
        const db = getDB();

        // Buscar todos los documentos en la colección 'comportamientos'
        const compDocs = await db.collection('comportamientos').find().toArray();

        // Construir objeto donde cada clave es el nombre del evento y el valor son los datos
        const comportamientos = {};
        compDocs.forEach(doc => {
            comportamientos[doc.evento] = doc.datos;
        });

        // Enviar el objeto de comportamientos como respuesta JSON
        res.json(comportamientos);
    } catch (err) {
        // Captura de errores: responder con status 500 y mensaje
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/comportamientos
 * 
 * Función que crea un nuevo comportamiento/evento en la base de datos.
 * - Recibe en el body un objeto con los campos 'evento' y 'datos'.
 * - Valida que ambos campos existan.
 * - Inserta un nuevo documento en la colección 'comportamientos'.
 * - Devuelve confirmación de éxito o error.
 * 
 * Ejemplo de body esperado:
 * {
 *   "evento": "Rumor",
 *   "datos": {
 *     "Bitcoin": { "tipoPrincipal": "Sube", "Sube": {...}, "Baja": {...} }
 *   }
 * }
 */
export async function createComportamiento(req, res) {
    const { evento, datos } = req.body;

    // Validación: si falta 'evento' o 'datos', responder con error 400
    if (!evento || !datos) return res.status(400).json({ error: 'Faltan campos' });

    try {
        // Obtener la instancia de la base de datos
        const db = getDB();

        // Insertar el nuevo comportamiento en la colección 'comportamientos'
        await db.collection('comportamientos').insertOne({ evento, datos });

        // Responder con confirmación de éxito
        res.json({ ok: true });
    } catch (err) {
        // Captura de errores: responder con status 500 y mensaje
        res.status(500).json({ error: err.message });
    }
}
