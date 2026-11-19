import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { IdParamsSchema, type Template } from '@gitfolio/shared';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { PreviewErrorBoundary } from '../components/common/PreviewErrorBoundary.tsx';
import { PortfolioPreview } from '../components/editor/PortfolioPreview.tsx';
import type { EditorDocument } from '../stores/editor.store.ts';
import { useTemplate } from '../hooks/useTemplates.ts';
import { ApiError } from '../services/api.ts';
import { errorMessage } from '../utils/errorParser.ts';

const devices = {
  desktop: { label: 'Desktop', icon: Monitor, width: 'max-w-full' },
  tablet: { label: 'Tablet', icon: Tablet, width: 'max-w-[768px]' },
  mobile: { label: 'Mobile', icon: Smartphone, width: 'max-w-[375px]' },
};

function TemplateDemo({ template }: { template: Template }) {
  const [device, setDevice] = useState<keyof typeof devices>('desktop');
  const document = useMemo<EditorDocument>(() => ({
    themeConfig: template.defaultConfig.theme,
    sections: template.defaultConfig.sections.map((section, index) => ({ ...section, id: `demo-${template.id}-${index}`, sortOrder: index })),
  }), [template]);
  return <section aria-label="Template preview" className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-6">
      <h2 className="font-semibold text-stone-800">Preview</h2>
      <div className="flex gap-1" role="group" aria-label="Preview width">
        {(Object.keys(devices) as Array<keyof typeof devices>).map((value) => {
          const { label, icon: Icon } = devices[value];
          return <button type="button" key={value} aria-label={`${value} preview width`} aria-pressed={device === value} onClick={() => setDevice(value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm ${device === value ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
            <Icon size={16} aria-hidden="true" /><span className="hidden sm:inline">{label}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="bg-stone-100 p-2 sm:p-5"><div data-testid="template-preview-viewport" role="region" aria-label="Template preview content" tabIndex={0} className={`mx-auto max-h-[75dvh] w-full overflow-auto overscroll-contain rounded-lg bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-700 ${devices[device].width}`}>
      <PreviewErrorBoundary resetKey={template.id} message="Try loading the preview again, or return to the gallery to choose another design."><PortfolioPreview document={document} interactive /></PreviewErrorBoundary>
    </div></div>
    <p className="px-4 py-4 text-sm leading-6 text-stone-600 sm:px-6">Scroll through the preview to explore each section. You can customize the sample content, colors, and sections after creating your project.</p>
  </section>;
}

export default function TemplateDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const valid = IdParamsSchema.safeParse({ id }).success;
  const template = useTemplate(valid ? id : '');
  const missing = !valid || template.error instanceof ApiError && template.error.code === 'TEMPLATE_NOT_FOUND';
  return <WorkspaceShell><main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-10 sm:pt-12">
    <Link to={`/templates${location.search}`} className="mb-7 inline-flex min-h-11 items-center text-sm font-medium text-stone-600 hover:text-stone-950">Back to templates</Link>
    {missing ? <section role="alert" className="rounded-2xl border border-stone-200 bg-white p-8"><h1 className="text-3xl font-semibold tracking-tight">Template not found.</h1><p className="mt-4 leading-7 text-stone-600">This template link is invalid or the template is no longer available. Choose another design from the gallery.</p></section>
      : template.isPending ? <div role="status" aria-label="Loading template preview" className="space-y-6"><div className="h-10 w-2/3 animate-pulse rounded-xl bg-stone-200" /><div className="h-20 animate-pulse rounded-xl bg-stone-200/70" /><div className="h-96 animate-pulse rounded-2xl bg-stone-200/70" /></div>
      : template.isError || !template.data ? <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-8"><h1 className="text-2xl font-semibold">This preview couldn’t load.</h1><p className="mt-4 leading-7 text-stone-700">{errorMessage(template.error)}</p><button type="button" className="primary-button mt-5" onClick={() => void template.refetch()}>Try again</button></section>
      : <>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"><div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <div className="mb-3 flex flex-wrap gap-2 text-sm text-stone-600"><span className="rounded-md bg-stone-100 px-2 py-1 capitalize">{template.data.category}</span><span className="py-1">{template.data.isReact ? 'React' : 'Static'} · {template.data.defaultConfig.sections.filter((section) => section.visible).length} sections</span></div>
          <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{template.data.name}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-stone-600">{template.data.description}</p>
        </div><Link to={`/projects/new?templateId=${template.data.id}`} className="primary-button">Use template</Link></div>
        <TemplateDemo key={template.data.id} template={template.data} />
      </>}
  </main></WorkspaceShell>;
}
