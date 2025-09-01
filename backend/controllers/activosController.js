import { getDB } from '../mongo.js';

/**
 * GET /api/activos
 * 
 * Función que maneja la ruta para obtener la lista de todos los activos.
 * - Conecta a la base de datos MongoDB.
 * - Consulta todos los documentos de la colección 'activos'.
 * - Devuelve un array con solo los nombres de los activos.
 * 
 * Ejemplo de respuesta JSON:
 * ["Bitcoin", "Ethereum", "USDT"]
 */
export async function getActivos(req, res) {
    try {
        // Obtener la instancia de la base de datos
        const db = getDB();

        // Buscar todos los documentos en la colección 'activos'
        const activosDocs = await db.collection('activos').find().toArray();

        // Extraer solo el campo 'nombre' de cada documento
        const activos = activosDocs.map(a => a.nombre);

        // Enviar como respuesta JSON el array de nombres
        res.json(activos);
    } catch (err) {
        // Captura de errores: responder con status 500 y mensaje
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/activos
 * 
 * Función que maneja la ruta para crear un nuevo activo en la base de datos.
 * - Recibe en el body del request un objeto con el campo 'nombre'.
 * - Valida que el campo exista.
 * - Inserta el nuevo activo en la colección 'activos'.
 * - Devuelve confirmación de éxito o error.
 * 
 * Ejemplo de body esperado:
 * { "nombre": "Bitcoin" }
 */
export async function createActivo(req, res) {
    const { nombre } = req.body;

    // Validación: si no se envía 'nombre', responder con error 400
    if (!nombre) {
        return res.status(400).json({ error: 'Falta el nombre' });
    }

    try {
        // Obtener la instancia de la base de datos
        const db = getDB();

        // Insertar un nuevo documento en la colección 'activos'
        await db.collection('activos').insertOne({ nombre });

        // Responder con confirmación de éxito
        res.json({ ok: true });
    } catch (err) {
        // Captura de errores: responder con status 500 y mensaje
        res.status(500).json({ error: err.message });
    }
}
