// backend/cargaDatosMongo.js

// Importa dotenv para leer las variables de entorno desde el archivo .env
import dotenv from 'dotenv';
dotenv.config();

// Importa el cliente de MongoDB
import { MongoClient } from 'mongodb';

// Obtiene la URI de conexión de MongoDB desde las variables de entorno
const MONGO_URI = process.env.MONGO_URI;

// Crea el cliente de MongoDB con esa URI
const client = new MongoClient(MONGO_URI);

// Lista de activos que queremos cargar en la base de datos
const activos = [
    "Bitcoin (BTC)","Ethereum (ETH)","Cardano (ADA)","Solana (SOL)","Ripple (XRP)",
    "Polkadot (DOT)","Litecoin (LTC)","Avalanche (AVAX)","Polygon (MATIC)",
    "Dogecoin (DOGE)","Shiba Inu (SHIB)","Chainlink (LINK)","Uniswap (UNI)",
    "Stellar (XLM)","Cosmos (ATOM)","Algorand (ALGO)","VeChain (VET)",
    "Aave (AAVE)","Filecoin (FIL)","Internet Computer (ICP)"
];

// Objeto que define los distintos comportamientos o reacciones de los activos
const comportamientos = {
  "Bitcoin": {
    "Bitcoin (BTC)": {
      "Sube": { "Ethereum (ETH)": "Sube", "Cardano (ADA)": "Sube", "Ripple (XRP)": "Baja" },
      "Baja": { "Ethereum (ETH)": "Baja", "Dogecoin (DOGE)": "Baja", "Shiba Inu (SHIB)": "Baja" }
    }
  },
  "Ethereum": {
    "Ethereum (ETH)": {
      "Sube": { "Polygon (MATIC)": "Sube", "Avalanche (AVAX)": "Sube", "Cardano (ADA)": "Sube" },
      "Baja": { "Polygon (MATIC)": "Baja", "Solana (SOL)": "Baja" }
    }
  },
  "Regulación": {
    "Bitcoin (BTC)": {
      "Sube": { "Ripple (XRP)": "Sube" },
      "Baja": { "Bitcoin (BTC)": "Baja", "Ethereum (ETH)": "Baja", "Cardano (ADA)": "Baja" }
    }
  },
  "Hackeo": {
    "Solana (SOL)": {
      "Sube": { "Bitcoin (BTC)": "Baja" },
      "Baja": { "Solana (SOL)": "Baja", "Ethereum (ETH)": "Baja" }
    }
  },
  "ETF aprobado": {
    "Bitcoin (BTC)": {
      "Sube": { "Bitcoin (BTC)": "Sube", "Ethereum (ETH)": "Sube" }
    }
  },
  "Halving": {
    "Bitcoin (BTC)": {
      "Sube": { "Bitcoin (BTC)": "Sube", "Aave (AAVE)": "Sube" }
    }
  }
};

// Función principal que ejecuta la carga de datos en MongoDB
async function main() {
  try {
    // Conectar al servidor MongoDB
    await client.connect();
    const db = client.db('proyecto_activos'); // Selecciona la base "proyecto_activos"

    // Limpia las colecciones si ya existían (borra todos los documentos)
    await db.collection('activos').deleteMany({});
    await db.collection('comportamientos').deleteMany({});

    // Inserta los activos
    // Convierte cada string en un documento con el campo "nombre"
    const activosDocs = activos.map(nombre => ({ nombre }));
    await db.collection('activos').insertMany(activosDocs);
    console.log('Activos cargados en MongoDB');

    // Inserta los comportamientos
    // Convierte el objeto en un array de documentos [{ evento, datos }, ...]
    const compDocs = Object.entries(comportamientos).map(([evento, datos]) => ({
      evento, // nombre del evento (ej: "Bitcoin", "Regulación", "Halving"...)
      datos   // estructura con los efectos sobre los activos
    }));
    await db.collection('comportamientos').insertMany(compDocs);
    console.log('Comportamientos cargados en MongoDB');

  } catch (err) {
    // Si ocurre algún error, lo muestra en consola
    console.error('Error cargando datos en MongoDB:', err);
  } finally {
    // Cierra la conexión a MongoDB siempre (haya o no error)
    await client.close();
  }
}

// Llama a la función principal
main();
