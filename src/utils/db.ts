import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb && cachedClient) {
    console.log('✅ Using cached database connection');
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI environment variable is not set');
  }

  console.log('🔄 Creating new database connection...');

  const client = await MongoClient.connect(MONGODB_URI, {
    maxPoolSize: 1,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  console.log('✅ Database connected successfully');
  return db;
}

export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedDb = null;
    cachedClient = null;
    console.log('🔌 Database connection closed');
  }
}