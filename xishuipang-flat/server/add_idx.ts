import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function main() {
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  const db = client.db('Xishuipang');
  const col = db.collection('Articles');

  // 先看一条 document 确认字段叫啥
  const sample = await col.findOne({});
  console.log('样本文档字段:', Object.keys(sample || {}));
  console.log('  volume:', sample?.volume, '(type:', typeof sample?.volume, ')');
  console.log('  slug  :', sample?.slug);
  console.log();

  console.time('创建索引');
  await col.createIndex(
    { volume: 1, slug: 1 },
    { name: 'volume_slug' }
  );
  console.timeEnd('创建索引');

  console.log('\n现在的索引:');
  const idx = await col.indexes();
  idx.forEach((i: any) => console.log(' ', JSON.stringify(i.key), i.name));

  await client.close();
}

main().catch(console.error);
