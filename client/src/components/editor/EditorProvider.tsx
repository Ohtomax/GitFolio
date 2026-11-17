import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { Project } from '@gitfolio/shared';
import type { EditorState } from '../../stores/editor.store.ts';
import { acquireEditorDraft, releaseEditorDraft, type EditorDraft } from '../../utils/editor-draft-cache.ts';

const EditorContext = createContext<EditorDraft | null>(null);
export function EditorProvider({ ownerId, project, children }: { ownerId: string; project: Project; children: ReactNode }) {
  const [draft] = useState(() => acquireEditorDraft(ownerId, project));
  useEffect(() => () => releaseEditorDraft(ownerId, project.id, draft), [ownerId, project.id, draft]);
  return <EditorContext.Provider value={draft}>{children}</EditorContext.Provider>;
}
export function useEditorDraft() {
  const draft = useContext(EditorContext);
  if (!draft) throw new Error('Editor context is unavailable.');
  return draft;
}
export const useEditorApi = () => useEditorDraft().store;
export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorApi(), selector);
}
