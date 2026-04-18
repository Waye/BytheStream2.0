import Redis from 'ioredis';

// ---------- 接口 ----------
interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  del(key: string): Promise<void>;
}

// ---------- Redis 实现 ----------
class RedisCache implements CacheAdapter {
  private redis: Redis;
  constructor(url: string) {
    this.redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 5000,
    });
    this.redis.on('error', (err) => console.warn('Redis error:', err.message));
  }
  async connect() { await this.redis.connect(); }
  async get(key: string) { return this.redis.get(key); }
  async set(key: string, value: string, ttlSec: number) {
    await this.redis.set(key, value, 'EX', ttlSec);
  }
  async del(key: string) { await this.redis.del(key); }
}

// ---------- 内存 fallback ----------
class MemoryCache implements CacheAdapter {
  private store = new Map<string, { value: string; expires: number }>();
  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { this.store.delete(key); return null; }
    return entry.value;
  }
  async set(key: string, value: string, ttlSec: number) {
    this.store.set(key, { value, expires: Date.now() + ttlSec * 1000 });
  }
  async del(key: string) { this.store.delete(key); }
}

// ---------- 单例导出 ----------
let cache: CacheAdapter;

export async function initCache(): Promise<CacheAdapter> {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const rc = new RedisCache(url);
      await rc.connect();
      cache = rc;
      console.log('✓ Redis connected');
    } catch (err) {
      console.warn('⚠ Redis unavailable, using in-memory cache');
      cache = new MemoryCache();
    }
  } else {
    console.log('ℹ No REDIS_URL, using in-memory cache');
    cache = new MemoryCache();
  }
  return cache;
}

export function getCache(): CacheAdapter { return cache; }

// ---------- 便捷包装 ----------
const DEFAULT_TTL = 3600; // 1h

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await fetcher();
  // 不 await — 写缓存不阻塞响应
  cache.set(key, JSON.stringify(data), ttl).catch(() => {});
  return data;
}
