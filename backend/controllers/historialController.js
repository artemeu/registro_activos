import { getDB } from '../mongo.js';

/**
 * GET /api/historial
 * Devuelve el historial completo de cambios agrupado por hora y activo.
 * La respuesta es un objeto donde cada clave es una hora (formato ISO) y el valor es otro objeto
 * con los activos y su cambio en ese momento.
 * Ejemplo de respuesta:
 * {
 *   "2024-08-29T14:00": { "Bitcoin": "Sube", "Ethereum": "Baja" },
 *   "2024-08-29T14:30": { "Bitcoin": "Baja" }
 * }
 */
export async function getHistorial(req, res) {
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        // Busca todos los documentos en la colección 'historial'
        const coleccion = db.collection('historial');
        const documentos = await coleccion.find().toArray();
        // Reorganiza los datos en un objeto agrupado por hora y activo
        const historialObj = {};
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });
        // Devuelve el historial como respuesta JSON
        res.json(historialObj);
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/historial/registro
 * Registra un cambio en el historial para un activo y hora determinados.
 * También puede registrar impactos (cambios en otros activos afectados por el evento principal).
 * Espera recibir en el body: hora (string), activo (string), cambio (string), impactos (objeto opcional)
 * Ejemplo de body:
 * {
 *   "hora": "2024-08-29T14:00",
 *   "activo": "Bitcoin",
 *   "cambio": "Sube",
 *   "impactos": { "Ethereum": "Baja" }
 * }
 * Devuelve el historial actualizado.
 */
export async function registrarCambio(req, res) {
    const { hora, activo, cambio, impactos } = req.body;
    // Validación básica: todos los campos principales deben estar presentes
    if (!hora || !activo || !cambio) {
        return res.status(400).json({ error: 'Faltan campos hora/activo/cambio' });
    }
    try {
        // Obtiene la conexión a la base de datos
        const db = getDB();
        const coleccion = db.collection('historial');
        // Inserta o actualiza el registro principal para ese activo y hora
        await coleccion.updateOne(
            { hora, activo },
            { $set: { cambio } },
            { upsert: true }
        );
        // Si hay impactos (otros activos afectados), actualiza también esos registros en bloque
        if (impactos && typeof impactos === 'object') {
            const bulkOps = [];
            Object.entries(impactos).forEach(([afectado, resultado]) => {
                bulkOps.push({
                    updateOne: {
                        filter: { hora, activo: afectado },
                        update: { $set: { cambio: resultado } },
                        upsert: true
                    }
                });
            });
            if (bulkOps.length > 0) {
                await coleccion.bulkWrite(bulkOps);
            }
        }
        // Después de guardar, obtiene nuevamente todo el historial actualizado
        const documentos = await coleccion.find().toArray();
        const historialObj = {};
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });
        // Devuelve confirmación y el historial actualizado
        res.json({ ok: true, historial: historialObj });
    } catch (err) {
        // Si ocurre un error, responde con status 500 y el mensaje de error
        res.status(500).json({ error: err.message });
    }
}