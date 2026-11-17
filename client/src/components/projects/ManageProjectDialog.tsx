import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Archive, Trash2, X } from 'lucide-react';
import { UpdateProjectSchema, type Project } from '@gitfolio/shared';
import { useDeleteProject, useProject, useUpdateProject } from '../../hooks/useProjects.ts';
import { errorMessage } from '../../utils/errorParser.ts';
import { ProjectFields, type ProjectFieldErrors, type ProjectFieldValues } from './ProjectFields.tsx';

function ProjectSettings({ project, onClose }: { project: Project; onClose: () => void }) {
  const [values, setValues] = useState<ProjectFieldValues>({ name: project.name, slug: project.slug, repoName: project.repoName ?? '' });
  const [errors, setErrors] = useState<ProjectFieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const busy = update.isPending || remove.isPending;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = UpdateProjectSchema.safeParse({ ...values, repoName: values.repoName.trim() || null });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ name: fields.name?.[0], slug: fields.slug?.[0], repoName: fields.repoName?.[0] }); return;
    }
    setErrors({}); update.mutate({ id: project.id, data: parsed.data }, { onSuccess: onClose });
  }
  return <div className="p-6 sm:p-8">
    <p className="mb-6 text-sm text-stone-500">{project.template.name} · {project.sectionCount} sections</p>
    <form onSubmit={submit} noValidate>
      <ProjectFields values={values} errors={errors} disabled={busy} onChange={(field, value) => { setValues((previous) => ({ ...previous, [field]: value })); setErrors((previous) => ({ ...previous, [field]: undefined })); }} />
      {update.isError && <p className="mt-4 text-sm text-red-700" role="alert">{errorMessage(update.error)}</p>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-xl border border-stone-300 px-4 py-3 text-sm disabled:opacity-50" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" disabled={busy}>{update.isPending ? 'Saving…' : 'Save changes'}</button></div>
    </form>
    <div className="mt-8 border-t border-stone-200 pt-6"><h3 className="text-sm font-semibold">Keep it for later</h3><p className="mt-2 text-xs leading-5 text-stone-500">Archived projects keep their saved content and can be restored.</p><button type="button" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={() => update.mutate({ id: project.id, data: { status: project.status === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED' } }, { onSuccess: onClose })}><Archive size={14} aria-hidden="true" />{project.status === 'ARCHIVED' ? 'Restore project' : 'Archive project'}</button></div>
    <div className="mt-6 border-t border-stone-200 pt-6">
      {confirmDelete ? <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert"><h3 className="text-sm font-semibold text-red-900">Delete {project.name}?</h3><p className="mt-2 text-xs leading-5 text-red-800">This permanently removes the project and its saved content from GitFolio. Existing GitHub repositories are kept.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => remove.mutate(project.id, { onSuccess: onClose })}>{remove.isPending ? 'Deleting…' : 'Delete permanently'}</button><button type="button" className="text-sm font-medium text-stone-700 disabled:opacity-50" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep project</button></div></div>
        : <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-red-700 disabled:opacity-50" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={14} aria-hidden="true" />Delete project</button>}
      {remove.isError && <p className="mt-3 text-sm text-red-700" role="alert">{errorMessage(remove.error)}</p>}
    </div>
  </div>;
}
export function ManageProjectDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const project = useProject(id);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-labelledby="manage-project-title" onCancel={(event) => { event.preventDefault(); onClose(); }} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/40">
    <header className="flex items-center justify-between border-b border-stone-200 px-6 py-5"><h2 id="manage-project-title" className="text-xl font-semibold tracking-tight">Manage project</h2><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-stone-100" aria-label="Close project settings"><X size={18} /></button></header>
    {project.isPending ? <div role="status" className="space-y-4 p-8" aria-label="Loading project"><div className="h-12 animate-pulse rounded-xl bg-stone-100" /><div className="h-32 animate-pulse rounded-xl bg-stone-100" /></div>
      : project.isError ? <div className="p-8" role="alert"><p>{errorMessage(project.error)}</p><button className="primary-button mt-4" onClick={() => void project.refetch()}>Try again</button></div>
      : <ProjectSettings project={project.data} onClose={onClose} />}
  </dialog>;
}
