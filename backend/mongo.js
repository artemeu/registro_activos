// backend/mongo.js
import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGO_URI);

let db = null;

export async function conectar() {
    if (db) return db;
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        db = client.db('proyecto_activos');
        return db;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        throw error;
    }
}

export function getDB() {
    if (!db) {
        throw new Error('Primero debes conectar a la base de datos');
    }
    return db;
}
