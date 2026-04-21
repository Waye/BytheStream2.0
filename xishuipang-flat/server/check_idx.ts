import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function main() {
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  const db = client.db('Xishuipang');   // ← 明确指定
  const idx = await db.collection('Articles').indexes();
  console.log('Articles 索引:');
  idx.forEach((i: any) => console.log(' ', JSON.stringify(i.key), i.name));

  // 顺便看看集合有多少文档
  const count = await db.collection('Articles').countDocuments();
  console.log(`\nArticles 文档总数: ${count}`);

  await client.close();
}

main().catch(console.error);
