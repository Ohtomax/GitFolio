import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ServiceError } from '../../utils/service-error.js';

export const DeploymentErrorHandler: ErrorRequestHandler = (error: unknown, _request, _response, next) => {
  next(error instanceof ZodError ? new ServiceError(400, 'INVALID_DEPLOYMENT_REQUEST', 'Check the publishing request and try again.') : error);
};
