import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');

  client = new MongoClient(uri, {
    // 连接池 — Atlas 免费层最多 500
    maxPoolSize: 20,
    minPoolSize: 2,
    maxIdleTimeMS: 30_000,
  });

  await client.connect();
  db = client.db(process.env.MONGO_DB || 'Xishuipang');

  console.log('✓ MongoDB connected');
  return db;
}

// 快捷取集合
export function col<T extends Document = Document>(name: string): Collection<T> {
  if (!db) throw new Error('MongoDB not connected — call connectMongo() first');
  return db.collection<T>(name);
}

// 优雅关闭
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✓ MongoDB disconnected');
  }
}
