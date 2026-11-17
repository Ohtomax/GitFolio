import type { RequestHandler } from 'express';
import { DeploymentQuerySchema, IdParamsSchema, StartDeploymentSchema } from '@gitfolio/shared';
import type { DeploymentService } from './deployment.service.js';
import { ServiceError } from '../../utils/service-error.js';

export function createDeploymentController(service: DeploymentService) {
  const run = (handler: (userId: string, id: string, request: Parameters<RequestHandler>[0]) => Promise<unknown>, status = 200): RequestHandler => (request, response, next) => {
    try {
      if (!request.auth) throw new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');
      const { id } = IdParamsSchema.parse(request.params);
      handler(request.auth.userId, id, request).then((data) => response.status(status).json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  return {
    capability: run((userId, id) => service.capability(userId, id)),
    start: run((userId, id, request) => service.start(userId, id, StartDeploymentSchema.parse(request.body)), 202),
    list: run((userId, id, request) => service.list(userId, id, DeploymentQuerySchema.parse(request.query))),
    get: run((userId, id) => service.get(userId, id)),
  };
}
