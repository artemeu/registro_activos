// Carga las variables de entorno desde el archivo .env (por ejemplo, la URI de MongoDB)
import dotenv from 'dotenv';
dotenv.config();

// Importa las librerías necesarias para el servidor
import express from 'express'; // Framework web para Node.js
import cors from 'cors';       // Middleware para permitir CORS (peticiones entre dominios)
import path from 'path';       // Utilidad para manejar rutas de archivos
import { fileURLToPath } from 'url'; // Convierte la URL del módulo en una ruta de archivo
import { conectar } from './mongo.js'; // Función para conectar a la base de datos MongoDB

// Importa las rutas de la API, cada una maneja un recurso diferente
import activosRoutes from './routes/activos.js';
import comportamientosRoutes from './routes/comportamientos.js';
import historialRoutes from './routes/historial.js';

// Obtiene la ruta absoluta del archivo actual y su directorio (necesario en ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa la aplicación de Express y define el puerto de escucha
const app = express();
const PORT = process.env.PORT || 3000;

// Define la ruta absoluta a la carpeta del frontend (donde están los archivos HTML, JS, CSS)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Middlewares globales:
// - Permite peticiones desde otros orígenes (CORS)
// - Permite recibir y parsear JSON en las peticiones
// - Sirve archivos estáticos del frontend (HTML, JS, CSS, imágenes)
app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

// Rutas de la API (cada una delega en su archivo de rutas correspondiente)
// Estas rutas devuelven y reciben datos en formato JSON
app.use('/api/activos', activosRoutes);
app.use('/api/comportamientos', comportamientosRoutes);
app.use('/api/historial', historialRoutes);

// Rutas para servir los archivos HTML principales desde la subcarpeta html
// Esto permite que al navegar a /crearActivo.html, por ejemplo, se sirva el archivo correcto
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'html', 'index.html'));
});
app.get('/crearActivo.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'html', 'crearActivo.html'));
});
app.get('/crearComportamiento.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'html', 'crearComportamiento.html'));
});
app.get('/historial.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'html', 'historial.html'));
});
app.get('/verComportamientos.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'html', 'verComportamientos.html'));
});

// Conecta a MongoDB y arranca el servidor solo si la conexión es exitosa
// Si la conexión falla, el servidor no se inicia
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