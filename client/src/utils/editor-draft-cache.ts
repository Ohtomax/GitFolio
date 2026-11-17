import type { Project } from '@gitfolio/shared';
import { createEditorStore, type EditorStore } from '../stores/editor.store.ts';

export interface EditorDraft {
  store: EditorStore;
  revision: number;
  recovered: boolean;
  retain: boolean;
}
// Memory only: an interrupted session must not put portfolio content in browser storage.
const drafts = new Map<string, EditorDraft>();
const keyFor = (ownerId: string, projectId: string) => `${ownerId}:${projectId}`;
export function acquireEditorDraft(ownerId: string, project: Project): EditorDraft {
  const cached = drafts.get(keyFor(ownerId, project.id));
  if (cached?.store.getState().dirty) {
    cached.recovered = true; cached.retain = true;
    return cached;
  }
  return { store: createEditorStore({ themeConfig: project.themeConfig, sections: project.sections }),
    revision: project.editorRevision, recovered: false, retain: true };
}
export function releaseEditorDraft(ownerId: string, projectId: string, draft: EditorDraft) {
  const key = keyFor(ownerId, projectId);
  drafts.delete(key);
  if (draft.retain && draft.store.getState().dirty) drafts.set(key, draft);
  // Keep only the five most recently interrupted projects in this page session.
  while (drafts.size > 5) { const oldest = drafts.keys().next().value; if (oldest) drafts.delete(oldest); }
}
