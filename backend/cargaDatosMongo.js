// backend/cargaDatosMongo.js
import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

const activos = [
    "Bitcoin (BTC)","Ethereum (ETH)","Cardano (ADA)","Solana (SOL)","Ripple (XRP)",
    "Polkadot (DOT)","Litecoin (LTC)","Avalanche (AVAX)","Polygon (MATIC)",
    "Dogecoin (DOGE)","Shiba Inu (SHIB)","Chainlink (LINK)","Uniswap (UNI)",
    "Stellar (XLM)","Cosmos (ATOM)","Algorand (ALGO)","VeChain (VET)",
    "Aave (AAVE)","Filecoin (FIL)","Internet Computer (ICP)"
];

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

async function main() {
  try {
    await client.connect();
    const db = client.db('proyecto_activos');

    // Limpio colecciones si existen
    await db.collection('activos').deleteMany({});
    await db.collection('comportamientos').deleteMany({});

    // Inserto activos (un documento por cada nombre)
    const activosDocs = activos.map(nombre => ({ nombre }));
    await db.collection('activos').insertMany(activosDocs);
    console.log('Activos cargados en MongoDB');

    // Inserto comportamientos - un documento por evento (clave superior)
    const compDocs = Object.entries(comportamientos).map(([evento, datos]) => ({
      evento,
      datos
    }));
    await db.collection('comportamientos').insertMany(compDocs);
    console.log('Comportamientos cargados en MongoDB');

  } catch (err) {
    console.error('Error cargando datos en MongoDB:', err);
  } finally {
    await client.close();
  }
}

main();
