// backend/server.js

// Importar y configurar variables de entorno desde .env
import dotenv from 'dotenv';
dotenv.config();

// Importar librerías necesarias
import express from 'express';   // Framework web
import cors from 'cors';         // Middleware para CORS
import path from 'path';         // Para manejo de rutas
import { fileURLToPath } from 'url';  // Para convertir URL a ruta
import { conectar, getDB } from './mongo.js'; // Funciones para MongoDB

// Obtener ruta absoluta del directorio actual (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear instancia de Express
const app = express();
// Puerto para el servidor, configurable con variable de entorno o 3000 por defecto
const PORT = process.env.PORT || 3000;
// Ruta absoluta al directorio frontend (carpeta pública)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Middleware para permitir CORS (Cross-Origin Resource Sharing) en todas las rutas
app.use(cors());

// Middleware para parsear cuerpos JSON en las peticiones
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS del frontend)
app.use(express.static(FRONTEND_DIR));

// Conectar a MongoDB y luego arrancar el servidor Express
conectar()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('No se pudo iniciar el servidor:', err);
        process.exit(1);
    });

// --- ENDPOINTS ---

// GET /api/activos
// Devuelve la lista de nombres de activos desde la colección 'activos' de MongoDB
app.get('/api/activos', async (req, res) => {
    try {
        const db = getDB();
        // Trae todos los documentos de la colección activos
        const activosDocs = await db.collection('activos').find().toArray();
        // Extrae solo el nombre de cada activo
        const activos = activosDocs.map(a => a.nombre);
        // Devuelve JSON con arreglo de nombres
        res.json(activos);
    } catch (err) {
        // En caso de error, envía status 500 y mensaje de error
        res.status(500).json({ error: err.message });
    }
});

// GET /api/comportamientos
// Devuelve los comportamientos/eventos desde MongoDB, agrupados por 'evento'
app.get('/api/comportamientos', async (req, res) => {
    try {
        const db = getDB();
        const compDocs = await db.collection('comportamientos').find().toArray();
        const comportamientos = {};
        // Construye objeto { evento: datos }
        compDocs.forEach(doc => {
            comportamientos[doc.evento] = doc.datos;
        });
        res.json(comportamientos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/historial
// Devuelve el historial de cambios agrupados por hora y activo
app.get('/api/historial', async (req, res) => {
    try {
        const db = getDB();
        const coleccion = db.collection('historial');
        // Obtiene todos los documentos del historial
        const documentos = await coleccion.find().toArray();

        const historialObj = {};
        // Reorganiza datos: historialObj[hora][activo] = cambio
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });

        res.json(historialObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/registro
// Permite registrar un cambio en un activo a una hora determinada
// Además, aplica cambios en activos afectados ("impactos") si se proporcionan
app.post('/api/registro', async (req, res) => {
    const { hora, activo, cambio, impactos } = req.body;

    // Validación básica: deben enviarse hora, activo y cambio
    if (!hora || !activo || !cambio) {
        return res.status(400).json({ error: 'Faltan campos hora/activo/cambio' });
    }

    try {
        const db = getDB();
        const coleccion = db.collection('historial');

        // Actualiza o inserta el registro principal para ese activo y hora
        await coleccion.updateOne(
            { hora, activo },
            { $set: { cambio } },
            { upsert: true }
        );

        // Si hay impactos (otros activos afectados), actualiza también esos registros
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
                // Ejecuta todas las actualizaciones en bloque para eficiencia
                await coleccion.bulkWrite(bulkOps);
            }
        }

        // Luego de guardar, obtiene nuevamente todo el historial actualizado
        const documentos = await coleccion.find().toArray();
        const historialObj = {};
        documentos.forEach(doc => {
            if (!historialObj[doc.hora]) historialObj[doc.hora] = {};
            historialObj[doc.hora][doc.activo] = doc.cambio;
        });

        // Devuelve confirmación y el historial actualizado
        res.json({ ok: true, historial: historialObj });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
