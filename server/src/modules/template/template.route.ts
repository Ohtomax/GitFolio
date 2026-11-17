import { Router, type RequestHandler } from 'express';
import { createTemplateController } from './template.controller.js';
import { TemplateErrorHandler } from './template.error-handler.js';
import type { TemplateService } from './template.service.js';

export function createTemplateRouter(service: TemplateService, guard: RequestHandler) {
  const router = Router();
  const controller = createTemplateController(service);
  router.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(guard);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.use(TemplateErrorHandler);
  return router;
}
