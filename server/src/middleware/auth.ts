import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { Environment } from '../config/env.schema.js';
import type { SessionIdentity, SessionService } from '../modules/auth/session.service.js';
import { readCookie, SESSION_COOKIE } from '../utils/cookies.js';
import { ServiceError } from '../utils/service-error.js';

declare module 'express-serve-static-core' {
  interface Request { auth?: SessionIdentity }
}

export function verifyToken(sessions: SessionService, environment: Environment): RequestHandler {
  return (request, _response, next) => {
    const header = request.headers.authorization;
    const bearer = header?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
    const parsed = z.string().min(1).max(4096).safeParse(header ? bearer : readCookie(request, SESSION_COOKIE));
    if (!parsed.success) { next(new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.')); return; }
    if (!header && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.get('Origin') !== environment.CLIENT_URL) {
      next(new ServiceError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.')); return;
    }
    sessions.verify(parsed.data).then((identity) => { request.auth = identity; next(); }).catch(next);
  };
}
