import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ZodError } from 'zod';
import type { Environment } from '../../config/env.schema.js';
import { verifyToken } from '../../middleware/auth.js';
import { ServiceError } from '../../utils/service-error.js';
import { createAuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import type { SessionService } from './session.service.js';
import type { ErrorRequestHandler } from 'express';

const authErrorHandler: ErrorRequestHandler = (error: unknown, _request, _response, next) => {
  next(error instanceof ZodError ? new ServiceError(400, 'INVALID_AUTH_REQUEST', 'Invalid sign-in request. Please start again.') : error);
};

export function createAuthRouter(environment: Environment, auth: AuthService, sessions: SessionService) {
  const router = Router();
  const controller = createAuthController(environment, auth, sessions);
  const guard = verifyToken(sessions, environment);
  const signInLimiter = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Please try again later.' } } });
  router.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
  router.get('/github', signInLimiter, controller.github);
  router.get('/github/publish', signInLimiter, guard, controller.publish);
  router.post('/github/callback', signInLimiter, controller.callback);
  router.get('/me', guard, controller.me);
  router.post('/logout', guard, controller.logout);
  router.use(authErrorHandler);
  return router;
}
