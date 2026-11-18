import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { TemplateSummary, ThemeConfig } from '@gitfolio/shared';
import { PreviewErrorBoundary } from '../common/PreviewErrorBoundary.tsx';

const TemplateArtwork = lazy(() => import('./TemplateArtwork.tsx'));
export function TemplatePreview({ template, theme }: { template: TemplateSummary; theme?: ThemeConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  const placeholder = <div aria-hidden="true" className="aspect-[16/10] bg-stone-100 p-7"><div className="mb-8 h-2 w-1/3 rounded bg-stone-200" /><div className="h-12 w-2/3 rounded-lg bg-stone-200" /><div className="mt-6 grid grid-cols-3 gap-3">{[0, 1, 2].map((item) => <div key={item} className="h-10 rounded-lg bg-stone-200" />)}</div></div>;
  return <div ref={ref} className="aspect-[16/10] overflow-hidden" data-template-preview={template.id}>
    {visible ? <PreviewErrorBoundary resetKey={template.id}><Suspense fallback={placeholder}><TemplateArtwork template={template} theme={theme} /></Suspense></PreviewErrorBoundary> : placeholder}
  </div>;
}
