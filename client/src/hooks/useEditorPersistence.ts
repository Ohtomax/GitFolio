import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { Project } from '@gitfolio/shared';
import { useEditorApi } from '../components/editor/EditorProvider.tsx';
import { editorService } from '../services/editor.service.ts';
import { projectDetailOptions, projectKeys } from './useProjects.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import type { EditorDocument } from '../stores/editor.store.ts';
import { createEditorSaveCoordinator, type EditorSaveStatus } from '../utils/editor-save-coordinator.ts';
import { errorMessage } from '../utils/errorParser.ts';

export function useEditorPersistence(project: Project) {
  const store = useEditorApi();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const active = useRef(true);
  const [status, setStatus] = useState<EditorSaveStatus>({ phase: 'idle' });
  const [reloading, setReloading] = useState(false);
  const mutation = useMutation({ mutationFn: ({ snapshot, revision }: { snapshot: EditorDocument; revision: number }) => editorService.save(project.id, revision, snapshot),
    onSuccess: async (saved) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      queryClient.setQueryData(projectKeys.detail(userId, project.id), saved);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId), refetchType: 'none' });
    },
  });
  const [coordinator] = useState(() => createEditorSaveCoordinator({ revision: project.editorRevision,
    baseline: store.getState().savedDocument, getDocument: () => store.getState().document,
    request: (snapshot, revision) => mutation.mutateAsync({ snapshot, revision }),
    onSaved: (snapshot) => store.getState().markSaved(snapshot), onStatus: setStatus,
    active: () => active.current && useAuthStore.getState().user?.id === userId,
  }));
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  async function reload() {
    if (status.phase === 'saving' || reloading) return;
    if (store.getState().dirty && !window.confirm('Discard unsaved changes and reload the saved project?')) return;
    setReloading(true);
    try {
      const saved = await queryClient.fetchQuery({ ...projectDetailOptions(userId, project.id), staleTime: 0 });
      if (!active.current || useAuthStore.getState().user?.id !== userId) return;
      const document = { themeConfig: saved.themeConfig, sections: saved.sections };
      if (coordinator.reset(saved.editorRevision, document)) store.getState().reset(document);
    } catch (error) { if (active.current) setStatus({ phase: 'error', error }); }
    finally { if (active.current) setReloading(false); }
  }
  const message = status.error instanceof ZodError
    ? 'Check the section fields and links before saving.' : status.error ? errorMessage(status.error) : null;
  return { status, message, reloading, save: () => coordinator.flush(), reload, coordinator };
}
