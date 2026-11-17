import { CreateProjectSchema, IdParamsSchema, ProjectQuerySchema, UpdateProjectSchema } from '@gitfolio/shared';
import type { Request, RequestHandler } from 'express';
import { ServiceError } from '../../utils/service-error.js';
import type { ProjectService } from './project.service.js';

function owner(request: Request): string {
  if (!request.auth) throw new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');
  return request.auth.userId;
}
export function createProjectController(service: ProjectService) {
  const list: RequestHandler = (request, response, next) => {
    try {
      const userId = owner(request);
      const query = ProjectQuerySchema.parse(request.query);
      service.list(userId, query).then((data) => response.json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  const get: RequestHandler = (request, response, next) => {
    try {
      const userId = owner(request);
      const { id } = IdParamsSchema.parse(request.params);
      service.get(userId, id).then((data) => response.json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  const create: RequestHandler = (request, response, next) => {
    try {
      const userId = owner(request);
      const input = CreateProjectSchema.parse(request.body);
      service.create(userId, input).then((data) => response.status(201).json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  const update: RequestHandler = (request, response, next) => {
    try {
      const userId = owner(request);
      const { id } = IdParamsSchema.parse(request.params);
      const input = UpdateProjectSchema.parse(request.body);
      service.update(userId, id, input).then((data) => response.json({ success: true, data })).catch(next);
    } catch (error) { next(error); }
  };
  const remove: RequestHandler = (request, response, next) => {
    try {
      const userId = owner(request);
      const { id } = IdParamsSchema.parse(request.params);
      service.delete(userId, id).then(() => response.json({ success: true, data: null })).catch(next);
    } catch (error) { next(error); }
  };
  return { list, get, create, update, remove };
}
