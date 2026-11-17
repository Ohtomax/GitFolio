import { Router, type RequestHandler } from 'express';
import { createProjectController } from './project.controller.js';
import { ProjectErrorHandler } from './project.error-handler.js';
import type { ProjectService } from './project.service.js';

export function createProjectRouter(service: ProjectService, guard: RequestHandler) {
  const router = Router();
  const controller = createProjectController(service);
  router.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(guard);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.patch('/:id/editor', controller.saveEditor);
  router.delete('/:id', controller.remove);
  router.use(ProjectErrorHandler);
  return router;
}
