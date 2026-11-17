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

function EditorWorkspace({ project }: { project: Project }) {
  const document = useEditor((state) => state.document);
  const selectedId = useEditor((state) => state.selectedId);
  const setSelectedId = useEditor((state) => state.selectSection);
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
    <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3 text-xs text-stone-500"><span>Canvas</span><span>{document.sections.filter((section) => section.visible).length} visible sections</span></div>
    {project.status === 'ARCHIVED' && <p role="status" className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This project is archived. Restore it from your projects to make changes.</p>}
    <div className="space-y-4 p-4 sm:p-6">{document.sections.filter((section) => section.visible).map((section) => <button key={section.id} type="button" aria-label={`Select ${section.type} section`} onClick={() => setSelectedId(section.id)} className={`block w-full rounded-xl border bg-white p-6 text-left sm:p-9 ${section.id === selectedId ? 'border-lime-600 ring-1 ring-lime-600' : 'border-stone-200'}`}><p className="text-[10px] font-medium uppercase tracking-widest text-lime-700">{section.type}</p><h2 className="mt-3 break-words text-2xl font-semibold tracking-tight">{typeof section.content.heading === 'string' && section.content.heading || 'Untitled section'}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-stone-500">{typeof section.content.description === 'string' ? section.content.description : ''}</p></button>)}{!document.sections.some((section) => section.visible) && <p className="rounded-xl bg-white p-10 text-center text-sm text-stone-500">No visible sections.</p>}</div>
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
