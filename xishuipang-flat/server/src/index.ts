import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import mercurius from 'mercurius';
import { connectMongo, closeMongo } from './db.js';
import { initCache } from './cache.js';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './loaders.js';

async function main() {
  // ---- 基础设施 ----
  await connectMongo();
  await initCache();

  // ---- Fastify ----
  const app = Fastify({ logger: true });

  // CORS — 允许前端地址
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:8081')
    .split(',')
    .map(s => s.trim());

  await app.register(cors, {
    origin: origins,
    credentials: true,
  });

  // 限流 — 100 req/min per IP
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ---- GraphQL (Mercurius) ----
  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: process.env.NODE_ENV !== 'production', // 开发期开启 GraphiQL
    context: () => ({
      // 每请求新建 DataLoader（避免跨请求缓存泄漏）
      loaders: createLoaders(),
      // TODO: 从 auth header 解析 userId
      userId: undefined,
    }),
  });

  // ---- 健康检查 ----
  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  // ---- 启动 ----
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
  console.log(`\n🚀 GraphQL server ready at http://localhost:${port}/graphiql\n`);

  // 优雅关闭
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
