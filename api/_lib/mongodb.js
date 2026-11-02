import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 3000, // Short timeout for serverless / health checks
  connectTimeoutMS: 3000
};

let client;
let clientPromise;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In dev mode, preserve across HMR module reloads
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  clientPromise = null;
}

export async function getDatabase(dbName = 'tower_defence') {
  if (!clientPromise) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

/**
 * Quick, non-blocking health check for MongoDB connectivity.
 * Times out strictly after 3000ms.
 */
export async function checkMongoHealth() {
  if (!uri || !uri.startsWith('mongodb')) {
    return { configured: false, connected: false, error: 'MONGODB_URI is not set or invalid.' };
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 3s')), 3000)
    );

    const pingPromise = (async () => {
      const db = await getDatabase();
      await db.command({ ping: 1 });
      return true;
    })();

    await Promise.race([pingPromise, timeoutPromise]);
    return { configured: true, connected: true };
  } catch (err) {
    return { configured: true, connected: false, error: err.message };
  }
}

export default clientPromise;
