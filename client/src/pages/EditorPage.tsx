import { useParams } from 'react-router-dom';
import { IdParamsSchema, type Project } from '@gitfolio/shared';
import { EditorFrame } from '../components/editor/EditorFrame.tsx';
import { PageSkeleton } from '../components/common/PageSkeleton.tsx';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { useProject } from '../hooks/useProjects.ts';
import { errorMessage } from '../utils/errorParser.ts';
import { EditorProvider, useEditor } from '../components/editor/EditorProvider.tsx';
import { EditorHistoryToolbar } from '../components/editor/EditorHistoryToolbar.tsx';
import { useAuthStore } from '../stores/auth.store.ts';
import { SectionNavigation } from '../components/editor/SectionNavigation.tsx';
import { SectionInspector } from '../components/editor/SectionInspector.tsx';
import { useEditorPersistence } from '../hooks/useEditorPersistence.ts';
import { ThemeControls } from '../components/editor/ThemeControls.tsx';
import { EditorCanvas } from '../components/editor/EditorCanvas.tsx';

function EditorWorkspace({ project }: { project: Project }) {
  const dirty = useEditor((state) => state.dirty);
  const panel = useEditor((state) => state.panel);
  const persistence = useEditorPersistence(project);
  const readOnly = project.status === 'ARCHIVED';
  const disabled = readOnly || persistence.reloading;
  return <EditorFrame name={project.name}
    toolbar={<><span role="status" className="mr-2 text-xs text-stone-500">{persistence.status.phase === 'saving' ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}</span><EditorHistoryToolbar disabled={disabled} /><button type="button" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs disabled:opacity-40" disabled={persistence.status.phase === 'saving' || persistence.reloading} onClick={() => void persistence.reload()}>Reload saved version</button><button type="button" className="primary-button" disabled={disabled || !dirty || persistence.status.phase === 'saving' || persistence.status.phase === 'conflict'} onClick={() => void persistence.save()}>Save changes</button></>}
    notice={persistence.message && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{persistence.message}</p>}
    navigation={<SectionNavigation disabled={disabled} />}
    inspector={panel === 'sections' ? <SectionInspector disabled={disabled} /> : <ThemeControls project={project} disabled={disabled} />}
  >
    <EditorCanvas archived={readOnly} />
  </EditorFrame>;
}
export default function EditorPage() {
  const { id = '' } = useParams();
  const valid = IdParamsSchema.safeParse({ id }).success;
  const project = useProject(id);
  const userId = useAuthStore((state) => state.user?.id ?? '');
  if (!valid) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project link is invalid.</h1></main></WorkspaceShell>;
  if (project.isPending) return <PageSkeleton label="Loading your project" />;
  if (project.isError) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project couldn’t load.</h1><p className="my-4 text-stone-600">{errorMessage(project.error)}</p><button className="primary-button" onClick={() => void project.refetch()}>Try again</button></main></WorkspaceShell>;
  return <EditorProvider key={`${userId}:${project.data.id}`} project={project.data}><EditorWorkspace project={project.data} /></EditorProvider>;
}
