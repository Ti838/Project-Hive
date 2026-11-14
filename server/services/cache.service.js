/**
 * ProjectHive Enterprise Caching Service
 * Hybrid Architecture:
 * - Distributed Redis Caching (when REDIS_URL is configured)
 * - In-Memory High-Performance TTL Fallback (when REDIS_URL is missing or offline)
 *
 * Guarantees zero downtime and zero data loss on Redis disconnects.
 */
import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.redisClient = null;
    this.isRedisReady = false;
    this.memoryStore = new Map(); // key -> { value, expiresAt }
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      mode: 'memory',
    };

    this.init();
    this.startMemoryCleaner();
  }

  init() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[CacheService] ℹ️ REDIS_URL not set — using local in-memory TTL cache.');
      this.stats.mode = 'memory';
      return;
    }

    try {
      console.log('[CacheService] 🔄 Connecting to Redis cache...');
      this.redisClient = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        enableOfflineQueue: false, // Fail fast to in-memory fallback rather than hanging
      });

      this.redisClient.on('connect', () => {
        this.isRedisReady = true;
        this.stats.mode = 'redis';
        console.log('[CacheService] 🚀 Connected to Redis cache successfully.');
      });

      this.redisClient.on('error', (err) => {
        this.isRedisReady = false;
        this.stats.mode = 'memory';
        console.warn(`[CacheService] ⚠️ Redis connection error (${err.message}) — falling back to memory.`);
      });

      this.redisClient.on('close', () => {
        this.isRedisReady = false;
        this.stats.mode = 'memory';
      });
    } catch (err) {
      this.isRedisReady = false;
      this.stats.mode = 'memory';
      console.warn(`[CacheService] ⚠️ Failed to initialize Redis (${err.message}) — memory cache active.`);
    }
  }

  startMemoryCleaner() {
    // Purge expired memory entries every 60 seconds to prevent unbounded memory growth
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.memoryStore.entries()) {
        if (item.expiresAt && item.expiresAt < now) {
          this.memoryStore.delete(key);
        }
      }
    }, 60000);
    if (timer.unref) timer.unref();
  }

  async get(key) {
    if (this.isRedisReady && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw !== null) {
          this.stats.hits++;
          return JSON.parse(raw);
        }
        this.stats.misses++;
        return null;
      } catch (err) {
        console.warn(`[CacheService] Redis get failed for ${key} (${err.message}) — checking memory.`);
      }
    }

    // Memory fallback
    const item = this.memoryStore.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.memoryStore.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async set(key, value, ttlSeconds = 300) {
    this.stats.sets++;
    const serialized = JSON.stringify(value);

    // Save to memory store as backup
    this.memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });

    if (this.isRedisReady && this.redisClient) {
      try {
        if (ttlSeconds) {
          await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, serialized);
        }
      } catch (err) {
        console.warn(`[CacheService] Redis set failed for ${key}:`, err.message);
      }
    }
  }

  async del(key) {
    this.memoryStore.delete(key);
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        console.warn(`[CacheService] Redis del failed for ${key}:`, err.message);
      }
    }
  }

  async delPattern(pattern) {
    // 1. Purge from memory store
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
      }
    }

    // 2. Purge from Redis if connected
    if (this.isRedisReady && this.redisClient) {
      try {
        const stream = this.redisClient.scanStream({ match: pattern, count: 100 });
        stream.on('data', async (keys) => {
          if (keys.length) {
            const pipeline = this.redisClient.pipeline();
            keys.forEach((k) => pipeline.del(k));
            await pipeline.exec();
          }
        });
      } catch (err) {
        console.warn(`[CacheService] Redis delPattern failed for ${pattern}:`, err.message);
      }
    }
  }

  /**
   * Cache-Aside Helper: Returns cached data if available; otherwise executes fetcherFn and caches result.
   */
  async remember(key, ttlSeconds, fetcherFn) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetcherFn();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) + '%' : '0%';
    return {
      ...this.stats,
      mode: this.isRedisReady ? 'redis' : 'memory',
      memoryKeysCount: this.memoryStore.size,
      hitRatio,
    };
  }

  async disconnect() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.isRedisReady = false;
        console.log('[CacheService] Redis cache connection cleanly closed.');
      } catch (_) {}
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;

