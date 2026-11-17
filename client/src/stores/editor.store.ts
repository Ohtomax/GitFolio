import { createStore } from 'zustand/vanilla';
import type { Project } from '@gitfolio/shared';

export type EditorDocument = Pick<Project, 'themeConfig' | 'sections'>;
interface HistoryFrame { document: EditorDocument; selectedId: string | null }
export interface EditorState {
  document: EditorDocument;
  savedDocument: EditorDocument;
  selectedId: string | null;
  panel: 'sections' | 'theme';
  past: HistoryFrame[];
  future: HistoryFrame[];
  dirty: boolean;
  lastGroup: string | null;
  lastEditAt: number;
  setDocument: (document: EditorDocument, group?: string) => void;
  selectSection: (id: string | null) => void;
  setPanel: (panel: 'sections' | 'theme') => void;
  endGroup: () => void;
  undo: () => void;
  redo: () => void;
  reset: (document: EditorDocument) => void;
  markSaved: (snapshot: EditorDocument) => void;
}
export const documentKey = (document: EditorDocument) => JSON.stringify(document);
const selectedIn = (document: EditorDocument, selectedId: string | null) =>
  document.sections.some((section) => section.id === selectedId) ? selectedId : document.sections[0]?.id ?? null;

export function createEditorStore(initial: EditorDocument, now = Date.now) {
  const document = structuredClone(initial);
  return createStore<EditorState>()((set, get) => ({
    document, savedDocument: document, selectedId: document.sections[0]?.id ?? null, panel: 'sections',
    past: [], future: [], dirty: false, lastGroup: null, lastEditAt: 0,
    setDocument(next, group) {
      const state = get();
      const normalized = { ...next, sections: next.sections.map((section, index) => section.sortOrder === index ? section : { ...section, sortOrder: index }) };
      if (documentKey(normalized) === documentKey(state.document)) return;
      const timestamp = now();
      const coalesce = Boolean(group && state.lastGroup === group && timestamp - state.lastEditAt < 750);
      set({ document: normalized, selectedId: selectedIn(normalized, state.selectedId),
        past: coalesce ? state.past : [...state.past.slice(-49), { document: state.document, selectedId: state.selectedId }],
        future: [], dirty: documentKey(normalized) !== documentKey(state.savedDocument),
        lastGroup: group ?? null, lastEditAt: timestamp });
    },
    selectSection: (id) => set((state) => ({ selectedId: selectedIn(state.document, id), panel: 'sections', lastGroup: null })),
    setPanel: (panel) => set({ panel, lastGroup: null }),
    endGroup: () => set({ lastGroup: null }),
    undo() {
      const state = get(), frame = state.past.at(-1);
      if (!frame) return;
      set({ document: frame.document, selectedId: selectedIn(frame.document, frame.selectedId), past: state.past.slice(0, -1),
        future: [...state.future, { document: state.document, selectedId: state.selectedId }], lastGroup: null,
        dirty: documentKey(frame.document) !== documentKey(state.savedDocument) });
    },
    redo() {
      const state = get(), frame = state.future.at(-1);
      if (!frame) return;
      set({ document: frame.document, selectedId: selectedIn(frame.document, frame.selectedId), future: state.future.slice(0, -1),
        past: [...state.past.slice(-49), { document: state.document, selectedId: state.selectedId }], lastGroup: null,
        dirty: documentKey(frame.document) !== documentKey(state.savedDocument) });
    },
    reset(next) {
      const clean = structuredClone(next);
      set({ document: clean, savedDocument: clean, selectedId: selectedIn(clean, get().selectedId),
        past: [], future: [], dirty: false, lastGroup: null, lastEditAt: 0 });
    },
    markSaved(snapshot) {
      set((state) => ({ savedDocument: snapshot, dirty: documentKey(state.document) !== documentKey(snapshot) }));
    },
  }));
}
export type EditorStore = ReturnType<typeof createEditorStore>;
