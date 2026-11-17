import { IdParamsSchema, ProjectSchema, SaveEditorSchema } from '@gitfolio/shared';
import type { EditorDocument } from '../stores/editor.store.ts';
import { apiFetch } from './api.ts';

export const editorService = {
  save(id: string, baseRevision: number, snapshot: EditorDocument) {
    IdParamsSchema.parse({ id });
    const input = SaveEditorSchema.parse({ baseRevision, themeConfig: snapshot.themeConfig,
      sections: snapshot.sections.map(({ sortOrder: _sortOrder, ...section }) => section) });
    return apiFetch(`/api/projects/${id}/editor`, ProjectSchema, { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  },
};
