import { getDB } from '../mongo.js';

/**
 * GET /api/comportamientos
 * Obtiene todos los comportamientos/eventos desde la base de datos.
 * Devuelve un objeto donde cada clave es el nombre del evento y el valor son los datos asociados.
 * Ejemplo de respuesta: { "Rumor": { ... }, "Noticia": { ... } }
 */
export async function getComportamientos(req, res) {
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        // Busca todos los documentos en la colección 'comportamientos'
        const compDocs = await db.collection('comportamientos').find().toArray();
        // Construye un objeto donde cada clave es el evento y el valor son los datos asociados
        const comportamientos = {};
        compDocs.forEach(doc => {
            comportamientos[doc.evento] = doc.datos;
        });
        // Devuelve el objeto de comportamientos como respuesta JSON
        res.json(comportamientos);
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/comportamientos
 * Crea un nuevo comportamiento/evento en la base de datos.
 * Espera recibir en el body un objeto con los campos 'evento' y 'datos'.
 * Ejemplo de body: { "evento": "Rumor", "datos": { ... } }
 */
export async function createComportamiento(req, res) {
    const { evento, datos } = req.body;
    // Valida que se hayan enviado los campos necesarios
    if (!evento || !datos) return res.status(400).json({ error: 'Faltan campos' });
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        // Inserta el nuevo comportamiento en la colección 'comportamientos'
        await db.collection('comportamientos').insertOne({ evento, datos });
        // Devuelve confirmación de éxito
        res.json({ ok: true });
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}