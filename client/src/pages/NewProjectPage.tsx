import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LayoutTemplate } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateProjectSchema, type TemplateCategory } from '@gitfolio/shared';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { ProjectFields, type ProjectFieldErrors, type ProjectFieldValues } from '../components/projects/ProjectFields.tsx';
import { TemplatePreview } from '../components/projects/TemplatePreview.tsx';
import { useTemplates, useTemplate } from '../hooks/useTemplates.ts';
import { useCreateProject } from '../hooks/useProjects.ts';
import { ApiError } from '../services/api.ts';
import { errorMessage } from '../utils/errorParser.ts';
import { projectSlug } from '../utils/project-slug.ts';

export default function NewProjectPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<TemplateCategory>();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [values, setValues] = useState<ProjectFieldValues>({ name: '', slug: '', repoName: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [repoTouched, setRepoTouched] = useState(false);
  const [errors, setErrors] = useState<ProjectFieldErrors>({});
  const templates = useTemplates({ page, pageSize: 6, category });
  const selected = useTemplate(selectedId);
  const create = useCreateProject();
  const navigate = useNavigate();
  const selectedTemplate = selected.data;
  function change(field: keyof ProjectFieldValues, value: string) {
    const generated = projectSlug(value);
    setValues((previous) => ({ ...previous, [field]: value,
      ...(field === 'name' && !slugTouched ? { slug: generated } : {}),
      ...(field === 'name' && !repoTouched && !slugTouched ? { repoName: generated } : {}),
      ...(field === 'slug' && !repoTouched ? { repoName: value } : {}),
    }));
    if (field === 'slug') setSlugTouched(true);
    if (field === 'repoName') setRepoTouched(true);
    setErrors({}); create.reset();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = CreateProjectSchema.safeParse({ ...values, repoName: values.repoName.trim() || null, templateId: selectedId });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ name: fields.name?.[0], slug: fields.slug?.[0], repoName: fields.repoName?.[0] }); return;
    }
    setErrors({}); create.mutate(parsed.data, { onSuccess: (project) => {
      navigate('/dashboard', { replace: true, state: { createdProjectId: project.id } });
    } });
  }
  const slugError = create.error instanceof ApiError && create.error.code === 'PROJECT_SLUG_TAKEN' ? create.error.message : undefined;
  return <WorkspaceShell><main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-10 sm:pt-12">
    <Link to="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900"><ArrowLeft size={15} aria-hidden="true" />Back to projects</Link>
    <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-lime-700">A new beginning</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">New project<span className="text-lime-600">.</span></h1><p className="mt-4 text-sm leading-6 text-stone-500">Start with a little structure. Make the rest your own.</p></div><ol className="flex gap-5 text-xs sm:gap-8" aria-label="Project setup steps">{[{ number: 1, label: 'Choose a template' }, { number: 2, label: 'Project details' }].map((item) => <li key={item.number} aria-current={step === item.number ? 'step' : undefined} className={`inline-flex items-center gap-2 ${step === item.number ? 'font-semibold text-stone-950' : 'text-stone-400'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === item.number ? 'bg-lime-200 text-lime-950' : 'bg-stone-200/60'}`}>{step > item.number ? <Check size={13} aria-hidden="true" /> : `0${item.number}`}</span>{item.label}</li>)}</ol></div>
    {step === 1 ? <section className="mt-10" aria-label="Choose a template">
      <div className="mb-7 flex max-w-full gap-1 overflow-x-auto border-b border-stone-200 pb-4">{([{ label: 'All styles', value: undefined }, { label: 'Minimal', value: 'minimal' }, { label: 'Developer', value: 'developer' }, { label: 'Professional', value: 'professional' }, { label: 'Creative', value: 'creative' }] as const).map((item) => <button type="button" key={item.label} aria-pressed={category === item.value} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${category === item.value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-white'}`} onClick={() => { setCategory(item.value); setPage(1); }}>{item.label}</button>)}</div>
      {templates.isPending ? <div role="status" aria-label="Loading templates" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-stone-200/70" />)}</div>
        : templates.isError ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-8"><h2 className="text-xl font-semibold">Templates couldn’t load.</h2><p className="mt-3 text-sm text-stone-600">{errorMessage(templates.error)}</p><button className="primary-button mt-5" onClick={() => void templates.refetch()}>Try again</button></div>
        : templates.data?.items.length ? <><fieldset><legend className="sr-only">Select a template</legend><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{templates.data.items.map((template) => <label key={template.id} className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white transition-shadow focus-within:ring-2 focus-within:ring-lime-600 ${selectedId === template.id ? 'border-lime-600 ring-2 ring-lime-600' : 'border-stone-200 hover:shadow-md'}`}>
          <input type="radio" name="template" aria-label={template.name} aria-describedby={`template-description-${template.id}`} value={template.id} checked={selectedId === template.id} onChange={() => setSelectedId(template.id)} className="sr-only" />
          <TemplatePreview template={template} /><div className="border-t border-stone-200 p-5"><div className="flex items-center justify-between gap-3"><span className="text-lg font-semibold tracking-tight">{template.name}</span>{selectedId === template.id ? <CheckCircle2 size={18} className="shrink-0 text-lime-700" aria-hidden="true" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-stone-300" aria-hidden="true" />}</div><p id={`template-description-${template.id}`} className="mt-3 text-xs leading-5 text-stone-500">{template.description}</p><span className="mt-4 inline-block rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-stone-500">{template.isReact ? 'React' : 'Static'} · {template.category}</span></div>
        </label>)}</div></fieldset>{templates.data.totalPages > 1 && <div className="mt-6 flex items-center justify-end gap-3 text-sm"><button className="rounded-lg border border-stone-300 px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous templates</button><span>{page} / {templates.data.totalPages}</span><button className="rounded-lg border border-stone-300 px-3 py-2 disabled:opacity-40" disabled={page >= templates.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next templates</button></div>}</>
        : <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center"><LayoutTemplate className="mx-auto mb-4 text-stone-400" size={26} /><h2 className="text-xl font-semibold">No templates found.</h2><p className="mt-3 text-sm text-stone-500">Try another style or check back shortly.</p></div>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6"><p className="text-sm text-stone-500">{selectedTemplate ? `${selectedTemplate.name} selected. A good place to start.` : 'Choose the style that feels like you.'}</p><button type="button" className="primary-button inline-flex items-center gap-2" disabled={!selectedId} onClick={() => setStep(2)}>Continue<ArrowRight size={15} aria-hidden="true" /></button></div>
    </section> : <section className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-16" aria-label="Project details">
      <form onSubmit={submit} noValidate className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-9"><h2 className="mb-2 text-2xl font-semibold tracking-tight">Give your project a name.</h2><p className="mb-8 text-sm leading-6 text-stone-500">You can change these details later.</p><ProjectFields values={values} errors={{ ...errors, ...(slugError ? { slug: slugError } : {}) }} onChange={change} disabled={create.isPending} />
        {create.isError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{errorMessage(create.error)}</p>}
        <div className="mt-8 flex flex-wrap justify-between gap-3"><button type="button" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-3 text-sm disabled:opacity-50" disabled={create.isPending} onClick={() => { create.reset(); setStep(1); }}><ArrowLeft size={14} aria-hidden="true" />Change template</button><button className="primary-button inline-flex items-center gap-2" disabled={create.isPending || !selectedTemplate || selected.isError}>{create.isPending ? 'Creating project…' : 'Create project'}<ArrowRight size={15} aria-hidden="true" /></button></div><p className="mt-5 text-xs leading-5 text-stone-400">Your project starts as a private draft. Replace the illustrative content before publishing.</p>
      </form>
      <aside className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        {selected.isPending ? <div role="status" aria-label="Loading selected template" className="h-80 animate-pulse bg-stone-200/70" />
          : selected.isError ? <div role="alert" className="p-8"><h2 className="text-lg font-semibold">Your template couldn’t load.</h2><p className="mt-3 text-sm text-stone-600">{errorMessage(selected.error)}</p><button className="primary-button mt-4" onClick={() => void selected.refetch()}>Retry template</button></div>
          : selectedTemplate && <><TemplatePreview template={selectedTemplate} /><div className="border-t border-stone-200 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-widest text-lime-700">Your starting point</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">{selectedTemplate.name}</h2><p className="mt-3 text-sm leading-6 text-stone-500">{selectedTemplate.description}</p><p className="mt-5 text-xs font-semibold text-stone-600">Included sections</p><div className="mt-3 flex flex-wrap gap-2">{selectedTemplate.defaultConfig.sections.map((section, index) => <span key={`${section.type}-${index}`} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs capitalize text-stone-500">{section.type}</span>)}</div></div></>}
      </aside>
    </section>}
  </main></WorkspaceShell>;
}
