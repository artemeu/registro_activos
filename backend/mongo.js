// backend/mongo.js

// Importa dotenv para poder leer variables de entorno desde un archivo .env
import dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno en process.env

// Importa el cliente de MongoDB
import { MongoClient } from 'mongodb';

// Obtiene la URI de conexión a MongoDB desde las variables de entorno (.env)
const MONGO_URI = process.env.MONGO_URI;

// Crea un cliente de MongoDB usando la URI
const client = new MongoClient(MONGO_URI);

// Variable donde se guardará la referencia a la base de datos una vez conectada
let db = null;

/**
 * Función asincrónica para conectar a la base de datos.
 * - Si ya existe una conexión previa (db no es null), devuelve la misma conexión.
 * - Si no, intenta conectarse al servidor MongoDB usando el cliente.
 * - Una vez conectado, guarda la referencia a la base de datos 'proyecto_activos'.
 * - Si hay algún error, lo captura y lo muestra en consola.
 */
export async function conectar() {
    if (db) return db; // Reutiliza la conexión existente si ya está abierta
    try {
        await client.connect(); // Establece la conexión con MongoDB
        console.log('Conectado a MongoDB');
        db = client.db('proyecto_activos'); // Selecciona la base de datos "proyecto_activos"
        return db; // Devuelve la referencia a la base de datos
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        throw error; // Propaga el error para que lo maneje quien llame la función
    }
}

/**
 * Función para obtener la base de datos ya conectada.
 * - Si no hay conexión previa, lanza un error indicando que primero se debe conectar.
 * - Si ya está conectada, devuelve la referencia a la base de datos.
 */
export function getDB() {
    if (!db) {
        throw new Error('Primero debes conectar a la base de datos');
    }
    return db;
}
