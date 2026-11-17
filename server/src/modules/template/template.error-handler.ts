import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ServiceError } from '../../utils/service-error.js';

export const TemplateErrorHandler: ErrorRequestHandler = (error: unknown, _request, _response, next) => {
  next(error instanceof ZodError
    ? new ServiceError(400, 'INVALID_TEMPLATE_REQUEST', 'Check the template ID and filter values.') : error);
};
