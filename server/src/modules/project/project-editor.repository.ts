import { Prisma, type PrismaClient } from '@prisma/client';
import type { SaveEditorInput } from '@gitfolio/shared';
import { ServiceError } from '../../utils/service-error.js';
import { projectSelect } from './project.repository.js';

export async function saveProjectEditor(database: PrismaClient, userId: string, id: string, input: SaveEditorInput) {
  try {
    return await database.$transaction(async (transaction) => {
      // The conditional increment acquires the project row lock and rejects stale documents atomically.
      const gate = await transaction.project.updateMany({ where: { id, userId, editorRevision: input.baseRevision,
        status: { not: 'ARCHIVED' } }, data: { editorRevision: { increment: 1 } } });
      if (gate.count !== 1) {
        const project = await transaction.project.findUnique({ where: { id_userId: { id, userId } }, select: { id: true, status: true } });
        if (!project) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.');
        if (project.status === 'ARCHIVED') throw new ServiceError(409, 'PROJECT_ARCHIVED', 'Restore this project before editing it.');
        throw new ServiceError(409, 'EDITOR_CONFLICT', 'A newer version was saved elsewhere. Reload the saved version before saving again.');
      }
      const ids = input.sections.map((section) => section.id);
      const existing = await transaction.section.findMany({ where: { id: { in: ids } }, select: { id: true, projectId: true } });
      if (existing.some((section) => section.projectId !== id)) {
        throw new ServiceError(400, 'INVALID_EDITOR_CONTENT', 'Invalid section identifiers. Reload the saved project and try again.');
      }
      const existingIds = new Set(existing.map((section) => section.id));
      await transaction.section.deleteMany({ where: { projectId: id, ...(ids.length ? { id: { notIn: ids } } : {}) } });
      for (const [sortOrder, section] of input.sections.entries()) {
        const { id: sectionId, ...data } = section;
        if (existingIds.has(sectionId)) {
          await transaction.section.updateMany({ where: { id: sectionId, projectId: id }, data: { ...data, sortOrder } });
        } else {
          await transaction.section.create({ data: { ...data, id: sectionId, projectId: id, sortOrder }, select: { id: true } });
        }
      }
      return transaction.project.update({ where: { id_userId: { id, userId } },
        data: { themeConfig: input.themeConfig }, select: projectSelect });
    }, { maxWait: 5000, timeout: 15000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ServiceError(400, 'INVALID_EDITOR_CONTENT', 'Invalid section identifiers. Reload the saved project and try again.');
    }
    throw error;
  }
}
