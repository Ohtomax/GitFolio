import { memo, type ReactNode } from 'react';
import { PortfolioUrlSchema, type Project } from '@gitfolio/shared';
import type { EditorDocument } from '../../stores/editor.store.ts';
import { ThemeSurface } from './ThemeSurface.tsx';
import { sectionNames } from './SectionNavigation.tsx';

function PortfolioLink({ url, children, className, enabled }: { url?: string; children: ReactNode; className: string; enabled: boolean }) {
  const parsed = PortfolioUrlSchema.safeParse(url ?? '');
  if (!parsed.success || !parsed.data || !enabled) return <span className={className}>{children}</span>;
  return <a href={parsed.data} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}
const PortfolioSection = memo(function PortfolioSection({ section, interactive }: { section: Project['sections'][number]; interactive: boolean }) {
  const { content, type } = section;
  const list = ['projects', 'skills', 'experience', 'education'].includes(type);
  return <div className="portfolio-section">
    {type === 'hero' && content.eyebrow && <p className="portfolio-accent mb-4 text-xs font-semibold uppercase tracking-widest">{content.eyebrow}</p>}
    <h2 className={type === 'hero' ? 'portfolio-hero font-semibold leading-tight tracking-tight' : 'text-2xl font-semibold leading-tight tracking-tight'}>{content.heading || sectionNames[type]}</h2>
    {content.description && <p className="portfolio-muted mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7">{content.description}</p>}
    {list && Boolean(content.items?.length) && <div className={`mt-7 ${type === 'projects' || type === 'skills' ? 'portfolio-grid grid gap-4' : 'space-y-4'}`}>
      {content.items?.map((item, index) => <article key={index} className="portfolio-card min-w-0">
        <h3 className="text-base font-semibold"><PortfolioLink url={item.url} enabled={interactive} className="portfolio-accent underline-offset-4 hover:underline">{item.title || 'Untitled entry'}</PortfolioLink></h3>
        {item.subtitle && <p className="portfolio-muted mt-2 text-xs leading-6">{item.subtitle}</p>}
        {item.description && <p className="portfolio-muted mt-3 whitespace-pre-wrap text-sm leading-7">{item.description}</p>}
      </article>)}
    </div>}
    {['hero', 'contact'].includes(type) && content.buttonLabel && <div className="mt-7"><PortfolioLink url={content.buttonUrl} enabled={interactive} className="portfolio-action">{content.buttonLabel}</PortfolioLink></div>}
  </div>;
});

export function PortfolioPreview({ document, selectedId, onSelect, interactive = false }: {
  document: EditorDocument; selectedId?: string | null; onSelect?: (id: string) => void; interactive?: boolean;
}) {
  const sections = document.sections.filter((section) => section.visible);
  return <ThemeSurface theme={document.themeConfig} label="Portfolio preview" className="min-h-[400px] shadow-sm">
    {interactive && sections.length > 1 && <nav aria-label="Portfolio sections" className="portfolio-nav flex flex-wrap gap-x-5 gap-y-2 px-6 py-5 text-xs">
      {sections.map((section) => <a key={section.id} href={`#portfolio-${section.id}`} className="hover:underline">{section.content.heading || sectionNames[section.type]}</a>)}
    </nav>}
    {sections.map((section) => <section key={section.id} id={`portfolio-${section.id}`} aria-label={`${sectionNames[section.type]} portfolio section`}
      className={`relative scroll-mt-5 ${onSelect && selectedId === section.id ? 'ring-2 ring-inset ring-lime-600' : ''}`}>
      {onSelect && <button type="button" className="portfolio-accent absolute right-3 top-2 rounded bg-white px-2 py-1 font-sans text-[10px] font-semibold text-stone-700 shadow-sm focus-visible:outline-2 focus-visible:outline-lime-700"
        aria-label={`Select ${section.type} section`} aria-pressed={selectedId === section.id} onClick={() => onSelect(section.id)}>Edit {sectionNames[section.type]}</button>}
      <PortfolioSection section={section} interactive={interactive} />
    </section>)}
    {!sections.length && <p className="portfolio-muted px-6 py-20 text-center text-sm">No visible sections. Add a section or turn on its visibility to preview it here.</p>}
  </ThemeSurface>;
}
