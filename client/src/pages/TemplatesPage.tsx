import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutTemplate } from 'lucide-react';
import { TemplateQuerySchema, type TemplateCategory } from '@gitfolio/shared';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { TemplatePreview } from '../components/projects/TemplatePreview.tsx';
import { useTemplates } from '../hooks/useTemplates.ts';
import { errorMessage } from '../utils/errorParser.ts';

const categories = [
  { label: 'All styles', value: undefined }, { label: 'Minimal', value: 'minimal' },
  { label: 'Developer', value: 'developer' }, { label: 'Professional', value: 'professional' },
  { label: 'Creative', value: 'creative' }, { label: 'Premium', value: 'premium' },
] as const;

export default function TemplatesPage() {
  const [params, setParams] = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const parsed = TemplateQuerySchema.safeParse({ page: params.get('page') ?? 1, pageSize: 12, category: params.get('category') ?? undefined });
  const filters = parsed.success ? parsed.data : TemplateQuerySchema.parse({ page: 1, pageSize: 12 });
  const templates = useTemplates(filters);
  const data = templates.data;
  useEffect(() => {
    if (!parsed.success) { setParams({}, { replace: true }); return; }
    if (!data || filters.page <= Math.max(data.totalPages, 1)) return;
    const next = new URLSearchParams();
    if (filters.category) next.set('category', filters.category);
    if (data.totalPages > 1) next.set('page', String(data.totalPages));
    setParams(next, { replace: true });
  }, [parsed.success, data, filters.page, filters.category, setParams]);
  function changeFilters(page: number, category?: TemplateCategory) {
    const query = TemplateQuerySchema.parse({ page, pageSize: 12, category });
    const next = new URLSearchParams();
    if (query.category) next.set('category', query.category);
    if (query.page > 1) next.set('page', String(query.page));
    setParams(next);
    if (page !== filters.page) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start' });
    }
  }
  const gallerySearch = new URLSearchParams();
  if (filters.category) gallerySearch.set('category', filters.category);
  if (filters.page > 1) gallerySearch.set('page', String(filters.page));
  const previewSearch = gallerySearch.size ? `?${gallerySearch}` : '';
  return <WorkspaceShell><main className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-10 sm:pt-14">
    <div className="flex flex-wrap items-end justify-between gap-6"><div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-lime-700">Made for your next idea</p>
      <h1 ref={heading} tabIndex={-1} className="text-4xl font-semibold tracking-tight focus:outline-none sm:text-5xl">Templates<span className="text-lime-600">.</span></h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">Explore every starting point. Preview a design, try it at different screen sizes, and make it your own.</p>
    </div><Link to="/projects/new" className="primary-button">New project</Link></div>
    <div className="mb-8 mt-10 flex max-w-full gap-1 overflow-x-auto border-b border-stone-200 pb-5" role="group" aria-label="Template categories">
      {categories.map((category) => <button type="button" key={category.label} aria-pressed={filters.category === category.value}
        className={`min-h-11 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${filters.category === category.value ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-white'}`}
        onClick={() => changeFilters(1, category.value)}>{category.label}</button>)}
    </div>
    {templates.isPending ? <div role="status" aria-label="Loading templates" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-96 animate-pulse rounded-2xl bg-stone-200/70" />)}
    </div> : templates.isError ? <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
      <h2 className="text-xl font-semibold">Templates couldn’t load.</h2><p className="mt-3 leading-7 text-stone-700">{errorMessage(templates.error)}</p>
      <button type="button" className="primary-button mt-5" onClick={() => void templates.refetch()}>Try again</button>
    </section> : data?.items.length ? <>
      <p role="status" className="mb-5 text-sm text-stone-600">{data.total} {data.total === 1 ? 'template' : 'templates'} · Showing {(filters.page - 1) * filters.pageSize + 1}–{Math.min(filters.page * filters.pageSize, data.total)}</p>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Template gallery">
        {data.items.map((template) => <article key={template.id} aria-labelledby={`template-title-${template.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <Link to={`/templates/${template.id}${previewSearch}`} aria-label={`Preview ${template.name}`} className="group relative block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-700">
            <TemplatePreview template={template} />
            <span className="absolute bottom-3 right-3 inline-flex min-h-11 items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm group-hover:bg-stone-950 group-hover:text-white">Preview</span>
          </Link>
          <div className="flex flex-1 flex-col border-t border-stone-200 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap gap-2 text-sm text-stone-600"><span className="rounded-md bg-stone-100 px-2 py-1 capitalize">{template.category}</span><span className="px-1 py-1">{template.isReact ? 'React' : 'Static'}</span></div>
            <h2 id={`template-title-${template.id}`} className="break-words text-xl font-semibold tracking-tight">{template.name}</h2>
            <p className="mb-6 mt-3 text-sm leading-6 text-stone-600">{template.description}</p>
            <Link to={`/projects/new?templateId=${template.id}`} aria-label={`Use ${template.name}`} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-lime-700 hover:bg-lime-50">Use template</Link>
          </div>
        </article>)}
      </div>
      {data.totalPages > 1 && <nav aria-label="Template pages" className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="text-stone-600">Page {filters.page} of {data.totalPages}</span><div className="flex gap-2">
          <button type="button" className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 disabled:opacity-40" disabled={filters.page <= 1 || templates.isFetching} onClick={() => changeFilters(filters.page - 1, filters.category)}>Previous templates</button>
          <button type="button" className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 disabled:opacity-40" disabled={filters.page >= data.totalPages || templates.isFetching} onClick={() => changeFilters(filters.page + 1, filters.category)}>Next templates</button>
        </div>
      </nav>}
    </> : <section className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <LayoutTemplate className="mx-auto mb-5 text-stone-500" size={36} aria-hidden="true" /><h2 className="text-2xl font-semibold">No templates found.</h2>
      <p className="mt-3 leading-7 text-stone-600">Try another style or return to the full gallery.</p>
      <button type="button" className="primary-button mt-6" onClick={() => changeFilters(1)}>Show all templates</button>
    </section>}
  </main></WorkspaceShell>;
}
