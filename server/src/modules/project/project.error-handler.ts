import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import type { ErrorRequestHandler } from 'express';
import { ServiceError } from '../../utils/service-error.js';

export const ProjectErrorHandler: ErrorRequestHandler = (error: unknown, _request, _response, next) => {
  if (error instanceof ZodError) {
    next(new ServiceError(400, 'INVALID_PROJECT_REQUEST', 'Check the project fields and filters.')); return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { next(new ServiceError(409, 'PROJECT_SLUG_TAKEN', 'You already have a project with this slug.')); return; }
    if (error.code === 'P2025') { next(new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.')); return; }
    if (['P2003', 'P2034'].includes(error.code)) {
      next(new ServiceError(409, 'PROJECT_CONFLICT', 'The project changed while saving. Refresh and try again.')); return;
    }
  }
  next(error);
};
