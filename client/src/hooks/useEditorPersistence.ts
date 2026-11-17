import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { Project } from '@gitfolio/shared';
import { useEditor, useEditorDraft } from '../components/editor/EditorProvider.tsx';
import { editorService } from '../services/editor.service.ts';
import { projectDetailOptions, projectKeys } from './useProjects.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import type { EditorDocument } from '../stores/editor.store.ts';
import { createEditorSaveCoordinator, type EditorSaveStatus } from '../utils/editor-save-coordinator.ts';
import { errorMessage } from '../utils/errorParser.ts';
import { ApiError } from '../services/api.ts';

export function useEditorPersistence(project: Project) {
  const draft = useEditorDraft();
  const { store } = draft;
  const document = useEditor((state) => state.document);
  const dirty = useEditor((state) => state.dirty);
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const active = useRef(true);
  const [status, setStatus] = useState<EditorSaveStatus>({ phase: 'idle' });
  const [reloading, setReloading] = useState(false);
  const [recovered, setRecovered] = useState(draft.recovered);
  const mutation = useMutation({ mutationFn: ({ snapshot, revision }: { snapshot: EditorDocument; revision: number }) => editorService.save(project.id, revision, snapshot),
    onSuccess: async (saved) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      queryClient.setQueryData(projectKeys.detail(userId, project.id), saved);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId), refetchType: 'none' });
    },
  });
  const [coordinator] = useState(() => createEditorSaveCoordinator({ revision: draft.revision,
    baseline: store.getState().savedDocument, getDocument: () => store.getState().document,
    request: (snapshot, revision) => mutation.mutateAsync({ snapshot, revision }),
    onSaved: (snapshot, saved) => { draft.revision = saved.editorRevision; store.getState().markSaved(snapshot); }, onStatus: setStatus,
    active: () => active.current && useAuthStore.getState().user?.id === userId,
  }));
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    if (!dirty || recovered || reloading || project.status === 'ARCHIVED' || status.phase === 'error' || status.phase === 'conflict') return;
    const timer = window.setTimeout(() => void coordinator.flush(), 800);
    return () => window.clearTimeout(timer);
  }, [document, dirty, recovered, reloading, project.status, status.phase, coordinator]);
  async function reload() {
    if (status.phase === 'saving' || reloading) return;
    if (store.getState().dirty && !window.confirm('Discard unsaved changes and reload the saved project?')) return;
    setReloading(true);
    try {
      const saved = await queryClient.fetchQuery({ ...projectDetailOptions(userId, project.id), staleTime: 0 });
      if (!active.current || useAuthStore.getState().user?.id !== userId) return;
      const document = { themeConfig: saved.themeConfig, sections: saved.sections };
      if (coordinator.reset(saved.editorRevision, document)) {
        draft.revision = saved.editorRevision; draft.recovered = false;
        store.getState().reset(document); setRecovered(false);
      }
    } catch (error) {
      if (active.current) setStatus((current) => ({ phase: current.phase === 'conflict' ? 'conflict' : 'error', error }));
    }
    finally { if (active.current) setReloading(false); }
  }
  async function resume() {
    if (reloading) return;
    setReloading(true);
    try {
      const saved = await queryClient.fetchQuery({ ...projectDetailOptions(userId, project.id), staleTime: 0 });
      if (!active.current || useAuthStore.getState().user?.id !== userId) return;
      if (saved.editorRevision !== draft.revision) throw new ApiError(409, 'EDITOR_CONFLICT', 'A newer version was saved elsewhere. Your recovered draft is still visible; reload the saved version before saving again.');
      if (saved.status === 'ARCHIVED') throw new ApiError(409, 'PROJECT_ARCHIVED', 'Restore this project before editing it.');
      if (coordinator.reset(draft.revision, store.getState().savedDocument)) { draft.recovered = false; setRecovered(false); }
    } catch (error) { if (active.current) setStatus({ phase: error instanceof ApiError && error.status === 409 ? 'conflict' : 'error', error }); }
    finally { if (active.current) setReloading(false); }
  }
  const message = status.error instanceof ZodError
    ? 'Check the section fields and links before saving.' : status.error ? errorMessage(status.error) : null;
  return { status, message, reloading, recovered, resume, save: () => recovered ? Promise.resolve(false) : coordinator.flush(), reload };
}
