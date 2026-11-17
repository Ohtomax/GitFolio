import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { IdParamsSchema, type Project } from '@gitfolio/shared';
import { EditorFrame } from '../components/editor/EditorFrame.tsx';
import { PageSkeleton } from '../components/common/PageSkeleton.tsx';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { useProject } from '../hooks/useProjects.ts';
import { errorMessage } from '../utils/errorParser.ts';

function EditorWorkspace({ project }: { project: Project }) {
  const [selectedId, setSelectedId] = useState(project.sections[0]?.id ?? '');
  const selected = project.sections.find((section) => section.id === selectedId);
  const heading = selected && typeof selected.content.heading === 'string' ? selected.content.heading : selected?.type;
  return <EditorFrame name={project.name}
    toolbar={<span className="rounded-full bg-lime-100 px-3 py-1.5 text-xs font-medium text-lime-950">{project.template.name}</span>}
    navigation={<><h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-500">Sections · {project.sections.length}</h2><div className="max-h-96 space-y-2 overflow-y-auto">{project.sections.map((section) => <button key={section.id} type="button" aria-pressed={section.id === selectedId} className={`w-full rounded-xl border px-3 py-3 text-left text-sm capitalize ${section.id === selectedId ? 'border-lime-600 bg-lime-50' : 'border-stone-200 hover:bg-stone-50'}`} onClick={() => setSelectedId(section.id)}>{section.type}<span className="mt-1 block text-[10px] normal-case text-stone-400">{section.visible ? 'Visible' : 'Hidden'}</span></button>)}</div></>}
    inspector={<><h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-stone-500">Section details</h2>{selected ? <><p className="text-xs capitalize text-lime-700">{selected.type}</p><h3 className="mt-3 break-words text-lg font-semibold">{heading || 'Untitled section'}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-stone-500">{typeof selected.content.description === 'string' ? selected.content.description : ''}</p></> : <p className="text-sm text-stone-500">This project has no sections yet.</p>}</>}
  >
    <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3 text-xs text-stone-500"><span>Canvas</span><span>{project.sections.filter((section) => section.visible).length} visible sections</span></div>
    {project.status === 'ARCHIVED' && <p role="status" className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This project is archived. Restore it from your projects to make changes.</p>}
    <div className="space-y-4 p-4 sm:p-6">{project.sections.filter((section) => section.visible).map((section) => <button key={section.id} type="button" aria-label={`Select ${section.type} section`} onClick={() => setSelectedId(section.id)} className={`block w-full rounded-xl border bg-white p-6 text-left sm:p-9 ${section.id === selectedId ? 'border-lime-600 ring-1 ring-lime-600' : 'border-stone-200'}`}><p className="text-[10px] font-medium uppercase tracking-widest text-lime-700">{section.type}</p><h2 className="mt-3 break-words text-2xl font-semibold tracking-tight">{typeof section.content.heading === 'string' && section.content.heading || 'Untitled section'}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-stone-500">{typeof section.content.description === 'string' ? section.content.description : ''}</p></button>)}{!project.sections.some((section) => section.visible) && <p className="rounded-xl bg-white p-10 text-center text-sm text-stone-500">No visible sections.</p>}</div>
  </EditorFrame>;
}
export default function EditorPage() {
  const { id = '' } = useParams();
  const valid = IdParamsSchema.safeParse({ id }).success;
  const project = useProject(id);
  if (!valid) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project link is invalid.</h1></main></WorkspaceShell>;
  if (project.isPending) return <PageSkeleton label="Loading your project" />;
  if (project.isError) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project couldn’t load.</h1><p className="my-4 text-stone-600">{errorMessage(project.error)}</p><button className="primary-button" onClick={() => void project.refetch()}>Try again</button></main></WorkspaceShell>;
  return <EditorWorkspace key={project.data.id} project={project.data} />;
}
