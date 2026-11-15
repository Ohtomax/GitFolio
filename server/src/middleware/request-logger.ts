import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Logger } from 'pino';

export function requestLogger(logger: Logger): RequestHandler {
  return (request, response, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    response.setHeader('X-Request-Id', requestId);

    response.once('finish', () => {
      // Do not log URLs, queries, headers, or bodies: OAuth codes and PII can occur there.
      logger.info({
        requestId,
        method: request.method,
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      }, 'HTTP request completed');
    });

    next();
  };
}
