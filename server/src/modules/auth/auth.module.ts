import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { z } from 'zod';
import type { Environment } from '../../config/env.schema.js';
import { getGitHubOAuthConfiguration } from '../../config/github-oauth.js';
import { createGitHubProvider } from '../../providers/github.js';
import { createEncryptionService } from '../../utils/encryption.js';
import { createAuthRepository } from './auth.repository.js';
import { createAuthRouter } from './auth.route.js';
import { createAuthService, type OAuthStateStore } from './auth.service.js';
import { createSessionService, type SessionStore } from './session.service.js';
import { verifyToken } from '../../middleware/auth.js';
import { ServiceError } from '../../utils/service-error.js';
import type { RequestHandler } from 'express';

export function createFeatureGuard(environment: Environment, redis: Redis): RequestHandler {
  if (!environment.JWT_SECRET) return (_request, _response, next) => {
    next(new ServiceError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured.'));
  };
  return verifyToken(createSessionService(environment, createRedisAuthStores(redis).sessions), environment);
}

export function createRedisAuthStores(redis: Redis) {
  const key = (state: string) => `auth:oauth:${createHash('sha256').update(state).digest('hex')}`;
  const states: OAuthStateStore = {
    async put(state, value, seconds) { await redis.set(key(state), JSON.stringify(value), 'EX', seconds); },
    async take(state) {
      const saved = await redis.getdel(key(state));
      if (!saved) return null;
      try {
        const parsed = z.object({ verifier: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          bindingHash: z.string().regex(/^[a-f0-9]{64}$/), publishFor: z.string().regex(/^\d+$/).optional() }).safeParse(JSON.parse(saved));
        return parsed.success ? parsed.data : null;
      } catch { return null; }
    },
  };
  const sessions: SessionStore = {
    async set(sessionKey, userId, seconds) { await redis.set(sessionKey, userId, 'EX', seconds); },
    get: (sessionKey) => redis.get(sessionKey),
    async delete(sessionKey) { await redis.del(sessionKey); },
  };
  return { states, sessions };
}

export function createAuthModule(environment: Environment, database: PrismaClient, redis: Redis) {
  const configuration = getGitHubOAuthConfiguration(environment);
  if (!configuration || !environment.ENCRYPTION_KEY || !environment.JWT_SECRET) return undefined;
  const stores = createRedisAuthStores(redis);
  const auth = createAuthService(configuration, createAuthRepository(database), createGitHubProvider(configuration),
    createEncryptionService(environment.ENCRYPTION_KEY), stores.states);
  return createAuthRouter(environment, auth, createSessionService(environment, stores.sessions));
}
