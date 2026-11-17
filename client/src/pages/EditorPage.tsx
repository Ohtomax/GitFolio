import { Link, useParams } from 'react-router-dom';
import type { MouseEvent } from 'react';
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
import { useEditorNavigation } from '../hooks/useEditorNavigation.ts';

function EditorWorkspace({ project }: { project: Project }) {
  const dirty = useEditor((state) => state.dirty);
  const panel = useEditor((state) => state.panel);
  const persistence = useEditorPersistence(project);
  const navigation = useEditorNavigation();
  const readOnly = project.status === 'ARCHIVED';
  const disabled = readOnly || persistence.reloading;
  const phase = persistence.status.phase;
  const saveStatus = phase === 'saving' ? 'Saving…'
    : phase === 'conflict' ? 'Save paused'
    : phase === 'error' ? 'Changes not saved'
    : !dirty ? 'All changes saved'
    : persistence.recovered ? 'Recovered unsaved draft' : 'Unsaved changes · autosaves soon';
  return <EditorFrame name={project.name} beforeLogout={navigation.beforeLogout}
    toolbar={<><span role="status" className="mr-2 text-xs text-stone-500">{saveStatus}</span><EditorHistoryToolbar disabled={disabled} /><button type="button" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs disabled:opacity-40" disabled={persistence.status.phase === 'saving' || persistence.reloading} onClick={() => void persistence.reload()}>Reload saved version</button><button type="button" className="primary-button" disabled={disabled || !dirty || persistence.recovered || persistence.status.phase === 'saving' || persistence.status.phase === 'conflict'} onClick={() => void persistence.save()}>{persistence.status.phase === 'error' ? 'Retry save' : 'Save changes'}</button></>}
    notice={<>
      {navigation.blocker.state === 'blocked' && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p>You have unsaved changes. Stay to finish saving, or leave the editor.</p><div className="mt-3 flex gap-3"><button type="button" className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold" onClick={() => navigation.blocker.reset?.()}>Stay here</button><button type="button" className="rounded-lg bg-amber-950 px-3 py-2 text-xs font-semibold text-white" onClick={navigation.leave}>Leave editor</button></div></div>}
      {persistence.recovered && <div role="status" className="mb-5 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm text-stone-800"><p>An unsaved draft from this page session was recovered. Resume checks the saved version before autosave restarts.</p><button type="button" disabled={persistence.reloading || persistence.status.phase === 'conflict'} className="mt-3 rounded-lg border border-lime-700 px-3 py-2 text-xs font-semibold disabled:opacity-40" onClick={() => void persistence.resume()}>Resume draft</button></div>}
      {persistence.message && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{persistence.message}{phase === 'error' && (persistence.recovered ? ' Your draft is still here. Resume when the connection is available.' : ' Your changes are still here. Retry the save when ready.')}</p>}
    </>}
    navigation={<SectionNavigation disabled={disabled} />}
    inspector={panel === 'sections' ? <SectionInspector disabled={disabled} /> : <ThemeControls project={project} disabled={disabled} />}
  >
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3"><p className="text-[11px] text-stone-400">{readOnly ? 'View previous deployments for this archived project.' : dirty ? 'Save your changes before publishing.' : 'Your saved version is ready to publish.'}</p><Link to={`/projects/${project.id}/deployments`} aria-disabled={dirty || phase === 'saving' || persistence.reloading} onClick={(event: MouseEvent<HTMLAnchorElement>) => { if (dirty || phase === 'saving' || persistence.reloading) event.preventDefault(); }} className={`rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold ${dirty || phase === 'saving' ? 'text-stone-300' : 'text-lime-800'}`}>Publish &amp; history</Link></div>
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
  if (!project.data) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project couldn’t load.</h1><p className="my-4 text-stone-600">{errorMessage(project.error)}</p><button className="primary-button" onClick={() => void project.refetch()}>Try again</button></main></WorkspaceShell>;
  return <EditorProvider key={`${userId}:${project.data.id}`} ownerId={userId} project={project.data}><EditorWorkspace project={project.data} /></EditorProvider>;
}
