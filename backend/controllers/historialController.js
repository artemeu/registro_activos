import { getDB } from '../mongo.js';

/**
 * GET /api/historial
 * 
 * Función que devuelve el historial completo de cambios, agrupado por hora y por activo.
 * - Conecta a la base de datos MongoDB.
 * - Recupera todos los documentos de la colección 'historial'.
 * - Cada documento representa un cambio para un activo en un momento específico.
 * - Construye un objeto donde:
 *   - La clave superior es la hora (formato ISO, ej. "2024-08-29T14:00").
 *   - El valor es un objeto con activos y su cambio correspondiente ("Sube"/"Baja").
 * 
 * Ejemplo de respuesta:
 * {
 *   "2024-08-29T14:00": { "Bitcoin": "Sube", "Ethereum": "Baja" },
 *   "2024-08-29T14:30": { "Bitcoin": "Baja" }
 * }
 */
export async function getHistorial(req, res) {
    try {
        // Obtener conexión a la base de datos
        const db = getDB();

        // Obtener todos los documentos de la colección 'historial'
        const coleccion = db.collection('historial');
        const documentos = await coleccion.find().toArray();

        // Reorganizar los datos en un objeto agrupado por hora y activo
        const historialObj = {};
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });

        // Devolver el historial como respuesta JSON
        res.json(historialObj);
    } catch (err) {
        // Manejo de errores: responder con status 500 y mensaje de error
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/historial/registro
 * 
 * Función que registra cambios en el historial.
 * - Puede registrar múltiples cambios a la vez (activo principal + impactos).
 * - Recibe en el body:
 *   - hora: string con la hora del cambio (ej. "2024-08-29T14:00")
 *   - cambios: objeto con clave = activo, valor = cambio ("Sube" o "Baja")
 *     Ejemplo: { "Bitcoin": "Sube", "Ethereum": "Baja" }
 * - Utiliza operaciones bulkWrite para insertar o actualizar todos los cambios de manera eficiente.
 * - Devuelve el historial completo actualizado.
 */
export async function registrarCambio(req, res) {
    const { hora, cambios } = req.body;

    // Validación: verificar que existan hora y cambios
    if (!hora || !cambios || typeof cambios !== 'object') {
        return res.status(400).json({ error: 'Faltan campos hora o cambios' });
    }

    try {
        const db = getDB();
        const coleccion = db.collection('historial');

        // Construir operaciones bulk para cada cambio
        // upsert: true -> si no existe el documento, lo crea
        const bulkOps = Object.entries(cambios).map(([activo, cambio]) => ({
            updateOne: {
                filter: { hora, activo },
                update: { $set: { cambio } },
                upsert: true
            }
        }));

        // Ejecutar las operaciones bulk en la base de datos
        if (bulkOps.length > 0) await coleccion.bulkWrite(bulkOps);

        // Recuperar nuevamente todo el historial para devolverlo actualizado
        const documentos = await coleccion.find().toArray();
        const historialObj = {};
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });

        // Responder con estado OK y el historial actualizado
        res.json({ ok: true, historial: historialObj });
    } catch (err) {
        // Manejo de errores: responder con status 500 y mensaje de error
        res.status(500).json({ error: err.message });
    }
}
