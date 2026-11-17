import { documentKey, type EditorDocument } from '../stores/editor.store.ts';

export type EditorSavePhase = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
export interface EditorSaveStatus { phase: EditorSavePhase; error?: unknown }
export function createEditorSaveCoordinator<Result extends { editorRevision: number }>(options: {
  revision: number; baseline: EditorDocument; getDocument: () => EditorDocument;
  request: (snapshot: EditorDocument, revision: number) => Promise<Result>;
  onSaved: (snapshot: EditorDocument, result: Result) => void;
  onStatus: (status: EditorSaveStatus) => void; active?: () => boolean;
}) {
  let revision = options.revision;
  let savedKey = documentKey(options.baseline);
  let running: Promise<boolean> | null = null;
  let requested = false;
  let blocked = false;
  async function drain(): Promise<boolean> {
    do {
      requested = false;
      if (options.active && !options.active()) return false;
      const snapshot = options.getDocument();
      const key = documentKey(snapshot);
      if (key === savedKey) { options.onStatus({ phase: 'saved' }); continue; }
      options.onStatus({ phase: 'saving' });
      try {
        const result = await options.request(snapshot, revision);
        revision = result.editorRevision;
        savedKey = key;
        if (!options.active || options.active()) {
          options.onSaved(snapshot, result);
          options.onStatus({ phase: 'saved' });
        }
      } catch (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        blocked = code === 'EDITOR_CONFLICT' || code === 'PROJECT_ARCHIVED';
        if (!options.active || options.active()) options.onStatus({ phase: blocked ? 'conflict' : 'error', error });
        requested = false;
        return false;
      }
    } while (requested);
    return true;
  }
  return {
    flush(): Promise<boolean> {
      if (blocked) return Promise.resolve(false);
      requested = true;
      if (running) return running;
      running = drain().finally(() => { running = null; });
      return running;
    },
    getRevision: () => revision,
    reset(nextRevision: number, baseline: EditorDocument) {
      if (running) return false;
      revision = nextRevision; savedKey = documentKey(baseline); blocked = false; requested = false;
      options.onStatus({ phase: 'idle' });
      return true;
    },
  };
}
