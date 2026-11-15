import { Redis } from 'ioredis';
import type { Logger } from 'pino';
import type { Environment } from './env.schema.js';

export function createRedis(environment: Environment, logger: Logger): Redis {
  const redis = new Redis(environment.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
  });

  redis.on('error', () => logger.warn('Redis connection is unavailable'));
  return redis;
}
