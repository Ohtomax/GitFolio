import { createContext, useContext, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { Project } from '@gitfolio/shared';
import { createEditorStore, type EditorState, type EditorStore } from '../../stores/editor.store.ts';

const EditorContext = createContext<EditorStore | null>(null);
export function EditorProvider({ project, children }: { project: Project; children: ReactNode }) {
  const [store] = useState(() => createEditorStore({ themeConfig: project.themeConfig, sections: project.sections }));
  return <EditorContext.Provider value={store}>{children}</EditorContext.Provider>;
}
export function useEditorApi() {
  const store = useContext(EditorContext);
  if (!store) throw new Error('Editor context is unavailable.');
  return store;
}
export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorApi(), selector);
}
