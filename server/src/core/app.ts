import type { HealthResponse } from '@gitfolio/shared';
import cors from 'cors';
import express, { type Router } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { Environment } from '../config/env.schema.js';
import { errorHandler, notFound } from '../middleware/error-handler.js';
import { apiLimiter } from '../middleware/rate-limiter.js';
import { requestLogger } from '../middleware/request-logger.js';
import { ServiceError } from '../utils/service-error.js';

export interface AppDependencies {
  logger: Logger;
  checkReadiness: () => Promise<void>;
  authRouter?: Router;
}

export function createApp(environment: Environment, dependencies: AppDependencies) {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestLogger(dependencies.logger));
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (origin === undefined || origin === environment.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new ServiceError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  }));
  app.use('/api', apiLimiter(environment));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({ success: true, data: { status: 'ok' } } satisfies HealthResponse);
  });

  app.get('/api/health/ready', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    dependencies.checkReadiness().then(() => {
      response.json({ success: true, data: { status: 'ok' } } satisfies HealthResponse);
    }).catch(() => {
      next(new ServiceError(503, 'SERVICE_UNAVAILABLE', 'Required services are unavailable.'));
    });
  });

  app.use('/api/auth', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  }, dependencies.authRouter ?? ((_request, _response, next) => {
    next(new ServiceError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured.'));
  }));
  app.use(notFound);
  app.use(errorHandler(dependencies.logger));
  return app;
}
