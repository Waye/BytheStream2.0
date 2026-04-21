import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function main() {
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  const db = client.db('Xishuipang');
  const hits = await db.collection('Articles')
    .find({ slug: '1_prayer_s' })
    .project({ volume: 1, slug: 1, title: 1 })
    .toArray();
  console.log(`slug="1_prayer_s" 命中 ${hits.length} 条:`);
  hits.forEach(h => console.log(' ', h));
  await client.close();
}
main().catch(console.error);
