import { createHash, randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import type { Environment } from '../../config/env.schema.js';
import { ServiceError } from '../../utils/service-error.js';

const ClaimsSchema = z.object({ sub: z.string().uuid(), jti: z.string().uuid(),
  exp: z.number().int().positive(), iat: z.number().int().positive() });
export interface SessionIdentity { userId: string; sessionId: string; expiresAt: number }
export interface SessionStore {
  set(key: string, userId: string, seconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
}
export interface SessionService {
  issue(userId: string): Promise<{ token: string; expiresAt: number }>;
  verify(token: string): Promise<SessionIdentity>;
  revoke(identity: SessionIdentity): Promise<void>;
}
const key = (id: string) => `auth:session:${createHash('sha256').update(id).digest('hex')}`;
const unauthenticated = () => new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');

export function createSessionService(environment: Environment, store: SessionStore): SessionService {
  const secret = environment.JWT_SECRET;
  if (!secret) throw new ServiceError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured.');
  const options: SignOptions = { algorithm: 'HS256', issuer: 'gitfolio', audience: 'gitfolio-client',
    expiresIn: environment.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return {
    async issue(userId) {
      if (!z.string().uuid().safeParse(userId).success) throw unauthenticated();
      const token = jwt.sign({}, secret, { ...options, subject: userId, jwtid: randomUUID() });
      const claims = ClaimsSchema.parse(jwt.decode(token));
      const seconds = claims.exp - Math.floor(Date.now() / 1000);
      if (seconds <= 0) throw new ServiceError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured.');
      await store.set(key(claims.jti), userId, seconds);
      return { token, expiresAt: claims.exp * 1000 };
    },
    async verify(token) {
      let claims: z.infer<typeof ClaimsSchema>;
      try {
        claims = ClaimsSchema.parse(jwt.verify(token, secret, {
          algorithms: ['HS256'], issuer: 'gitfolio', audience: 'gitfolio-client',
        }));
      } catch { throw unauthenticated(); }
      if (await store.get(key(claims.jti)) !== claims.sub) throw unauthenticated();
      return { userId: claims.sub, sessionId: claims.jti, expiresAt: claims.exp * 1000 };
    },
    async revoke(identity) { await store.delete(key(identity.sessionId)); },
  };
}
