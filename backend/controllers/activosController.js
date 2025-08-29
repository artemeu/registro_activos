import { getDB } from '../mongo.js';

/**
 * GET /api/activos
 * Obtiene la lista de activos desde la base de datos.
 * Devuelve un array con los nombres de todos los activos registrados.
 * Ejemplo de respuesta: ["Bitcoin", "Ethereum", "USDT"]
 */
export async function getActivos(req, res) {
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        // Busca todos los documentos en la colección 'activos'
        const activosDocs = await db.collection('activos').find().toArray();
        // Extrae solo el campo 'nombre' de cada documento
        const activos = activosDocs.map(a => a.nombre);
        // Devuelve el array de nombres como respuesta JSON
        res.json(activos);
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/activos
 * Crea un nuevo activo en la base de datos.
 * Espera recibir en el body un objeto con el campo 'nombre'.
 * Ejemplo de body: { "nombre": "Bitcoin" }
 */
export async function createActivo(req, res) {
    const { nombre } = req.body;
    // Valida que se haya enviado el nombre
    if (!nombre) {
        return res.status(400).json({ error: 'Falta el nombre' });
    }
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        // Inserta el nuevo activo en la colección 'activos'
        await db.collection('activos').insertOne({ nombre });
        // Devuelve confirmación de éxito
        res.json({ ok: true });
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}