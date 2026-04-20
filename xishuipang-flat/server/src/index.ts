import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import mercurius from 'mercurius';
import { connectMongo, closeMongo, col } from './db.js';
import { initAudioState } from './audio.js';
import { initCache } from './cache.js';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './loaders.js';
import { parseAuthHeader } from './auth.js';

async function ensureIndexes() {
  // Users: provider+providerId 唯一（仅 providerId 存在时生效，兼容 email-only 老数据）
  await col('Users').createIndex(
    { provider: 1, providerId: 1 },
    { unique: true, partialFilterExpression: { providerId: { $exists: true } } },
  );
  await col('Users').createIndex({ email: 1 }, { sparse: true });
  await col('Users').createIndex({ id: 1 }, { unique: true });

  // Favorites（只存文章）
  await col('Favorites').createIndex(
    { userId: 1, articleId: 1 },
    { unique: true },
  );
  await col('Favorites').createIndex({ userId: 1, createdAt: -1 });

  console.log('✓ Indexes ensured');
}

async function main() {
  // ---- 基础设施 ----
  await connectMongo();
  initAudioState();
  await initCache();
  await ensureIndexes();

  // ---- Fastify ----
  const app = Fastify({ logger: true });

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:8081')
    .split(',')
    .map(s => s.trim());

  await app.register(cors, {
    origin: origins,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ---- GraphQL ----
  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: process.env.NODE_ENV !== 'production',
    context: (req) => {
      const authHeader = req.headers['authorization'] as string | undefined;
      const payload = parseAuthHeader(authHeader);
      return {
        loaders: createLoaders(),
        userId: payload?.userId,
      };
    },
  });

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
  console.log(`\n🚀 GraphQL server ready at http://localhost:${port}/graphiql\n`);

  const shutdown = async () => {
    console.log('\nShutting down...');
    await app.close();
    await closeMongo();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
