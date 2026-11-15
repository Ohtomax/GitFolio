import type { ApiResponse } from '@gitfolio/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { ServiceError } from '../utils/service-error.js';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  } satisfies ApiResponse<never>);
};

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ServiceError) {
      response.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      } satisfies ApiResponse<never>);
      return;
    }

    if (typeof error === 'object' && error !== null && 'type' in error) {
      if (error.type === 'entity.parse.failed') {
        response.status(400).json({
          success: false,
          error: { code: 'INVALID_JSON', message: 'The request body must contain valid JSON.' },
        } satisfies ApiResponse<never>);
        return;
      }

      if (error.type === 'entity.too.large') {
        response.status(413).json({
          success: false,
          error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body exceeds the allowed size.' },
        } satisfies ApiResponse<never>);
        return;
      }
    }

    logger.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Unhandled request error');
    response.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    } satisfies ApiResponse<never>);
  };
}
