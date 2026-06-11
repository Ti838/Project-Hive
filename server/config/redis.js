import Redis from 'ioredis';

let redis = null;

export function initializeRedis() {
  try {
    console.log('[v0] Initializing Redis connection...');
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
    });

    redis.on('connect', () => {
      console.log('[v0] Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('[v0] Redis connection error:', error.message);
    });

    return redis;
  } catch (error) {
    console.error('[v0] Failed to initialize Redis:', error.message);
    throw error;
  }
}

export function getRedisClient() {
  if (!redis) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redis;
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
