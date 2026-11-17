import { IdParamsSchema, TemplateQuerySchema } from '@gitfolio/shared';
import type { RequestHandler } from 'express';
import type { TemplateService } from './template.service.js';

export function createTemplateController(service: TemplateService) {
  const list: RequestHandler = (request, response, next) => {
    try {
      const query = TemplateQuerySchema.parse(request.query);
      service.list(query).then((data) => response.json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  const get: RequestHandler = (request, response, next) => {
    try {
      const { id } = IdParamsSchema.parse(request.params);
      service.get(id).then((data) => response.json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  return { list, get };
}
