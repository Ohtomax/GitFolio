import { Router, type RequestHandler } from 'express';
import type { DeploymentService } from './deployment.service.js';
import { createDeploymentController } from './deployment.controller.js';
import { DeploymentErrorHandler } from './deployment.error-handler.js';

export function createDeploymentRouter(service: DeploymentService, guard: RequestHandler) {
  const router = Router();
  router.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
  const controller = createDeploymentController(service);
  router.get('/projects/:id/publish', guard, controller.capability);
  router.post('/projects/:id/deploy', guard, controller.start);
  router.get('/projects/:id/deployments', guard, controller.list);
  router.get('/deployments/:id/status', guard, controller.get);
  router.use(DeploymentErrorHandler);
  return router;
}
