import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';
import type { RoleDocument, RoleItem, RoleMetric, RolePortfolioProps, RoleSection } from './contracts.ts';
import './roles.css';

export const sectionsOf = (document: RoleDocument) => document.sections.filter((section) => section.visible);
export const heroOf = (document: RoleDocument) => sectionsOf(document).find((section) => section.type === 'hero');
export const muted = 'text-[var(--rp-muted)]';
export const panel = 'rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)]';
export const control = 'rp-control min-h-11 rounded-md border border-[var(--rp-border)] px-3 py-2 text-xs font-medium transition-colors disabled:cursor-default';
export const codePanel = 'overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--rp-border)] bg-[var(--rp-bg)] p-4 font-mono text-xs leading-7';
const fonts = { sans: "'Geist',system-ui,sans-serif", serif: "'Newsreader',Georgia,serif", mono: "'Geist Mono',monospace" };
const MainIdContext = createContext<string | undefined>(undefined);
export function RoleMain({ children, className = '' }: { children: ReactNode; className?: string }) {
  const id = useContext(MainIdContext);
  return <main id={id} tabIndex={-1} className={className}>{children}</main>;
}
function contrastInk(hex: string) {
  const c = [1,3,5].map((i) => parseInt(hex.slice(i,i+2),16)/255).map((v) => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  const luminance = .2126*c[0]+.7152*c[1]+.0722*c[2];
  return (luminance+.05)/.05 >= 1.05/(luminance+.05) ? '#000000' : '#FFFFFF';
}
export function RoleRoot({ document, thumbnail, children }: RolePortfolioProps & { children: ReactNode }) {
  const id = useId();
  const c = document.themeConfig.colors, theme = document.themeConfig;
  const variables = { '--rp-bg':c.background, '--rp-text':c.text, '--rp-accent':c.accent, '--rp-ink':contrastInk(c.accent), '--rp-primary':c.primary ?? c.accent,
    '--rp-surface':c.surface ?? c.background, '--rp-muted':c.muted ?? c.text, '--rp-border':c.border ?? c.text,
    '--rp-success':c.success ?? c.accent, '--rp-warning':c.warning ?? c.accent, '--rp-danger':c.danger ?? c.accent,
    '--rp-font':fonts[theme.font], '--rp-heading':theme.layout === 'quality' && (theme.headingFont ?? 'sans') === 'sans' ? "'Manrope',system-ui,sans-serif" : fonts[theme.headingFont ?? theme.font],
    '--rp-space':{compact:'1.5rem',comfortable:'2.5rem',spacious:'4rem'}[theme.spacing] } as CSSProperties;
  return <div className={`rp-root rp-${theme.layout ?? 'backend'}`} data-role-layout={theme.layout} style={variables} role={thumbnail ? undefined : 'region'} aria-label={thumbnail ? undefined : 'Portfolio preview'}>
    {!thumbnail && <a className="rp-skip" href={`#${id}`}>Skip to portfolio content</a>}
    <MainIdContext.Provider value={thumbnail ? undefined : id}>{children}</MainIdContext.Provider>
    <footer className="rp-footer"><span>Thoughtful work. Clear evidence.</span>{theme.demo && <span data-demo-label>Illustrative profile · Sample organizations, metrics & research</span>}</footer>
  </div>;
}
export function RoleSectionFrame({ section, selectedId, onSelect, thumbnail, children, className = '' }: Pick<RolePortfolioProps,'selectedId'|'onSelect'|'thumbnail'> & { section: RoleSection; children: ReactNode; className?: string }) {
  return <section id={thumbnail ? undefined : `portfolio-${section.id}`} data-section-id={section.id} data-section-type={section.type}
    aria-label={`${section.type} portfolio section`} className={`rp-section ${selectedId === section.id && onSelect ? 'rp-selected' : ''} ${className}`}>
    {onSelect && <button type="button" className="rp-edit" aria-label={`Select ${section.type} section`} aria-pressed={selectedId === section.id} onClick={() => onSelect(section.id)}>Edit {section.type}</button>}
    {children}
  </section>;
}
export function RoleNavigation({ document, thumbnail }: RolePortfolioProps) {
  return <nav className="rp-nav" aria-label="Portfolio sections">{sectionsOf(document).filter((section) => section.type !== 'hero').map((section) => <a key={section.id} tabIndex={thumbnail ? -1 : undefined} href={thumbnail ? undefined : `#portfolio-${section.id}`}>{section.type === 'interactive' ? 'Live demo' : section.type}</a>)}</nav>;
}
export function SafeLink({ url, interactive = true, className = '', children }: { url?: string; interactive?: boolean; className?: string; children: ReactNode }) {
  let safe = false;
  try { const parsed = new URL(url ?? ''); safe = ['https:','http:'].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch { /* Mail addresses are checked separately. */ }
  if (/^mailto:[^\s<>@?]+@[^\s<>@?]+\.[^\s<>@?]+$/.test(url ?? '')) safe = true;
  return safe && interactive ? <a className={className} href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <span className={className}>{children}</span>;
}
export function Action({ section, interactive }: { section: RoleSection; interactive?: boolean }) {
  return section.content.buttonLabel ? <SafeLink url={section.content.buttonUrl} interactive={interactive} className="rp-action">{section.content.buttonLabel}</SafeLink> : null;
}
export function Intro({ section, eyebrow }: { section: RoleSection; eyebrow?: string }) {
  return <>{eyebrow && <p className="rp-kicker">{eyebrow}</p>}<h2 className="rp-heading">{section.content.heading}</h2>{section.content.subtitle && <p className="rp-subtitle">{section.content.subtitle}</p>}{section.content.description && <p className="rp-copy">{section.content.description}</p>}</>;
}
export function Metrics({ items = [], compact = false }: { items?: RoleMetric[]; compact?: boolean }) {
  return items.length ? <dl className={`rp-metrics ${compact ? 'rp-metrics-compact' : ''}`}>{items.map((item,index) => <div key={index}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : null;
}
export function Tags({ tags = [] }: { tags?: string[] }) {
  return tags.length ? <ul className="rp-tags">{tags.filter((tag) => tag.trim()).map((tag,index) => <li key={index}>{tag}</li>)}</ul> : null;
}
export function ItemTitle({ item, interactive }: { item: RoleItem; interactive?: boolean }) {
  return <><h3 className="rp-item-title"><SafeLink url={item.url} interactive={interactive}>{item.title}</SafeLink></h3>{item.subtitle && <p className="rp-meta">{item.subtitle}</p>}</>;
}
export function SupportingSection({ section, interactive }: { section: RoleSection; interactive?: boolean }) {
  return <><Intro section={section} /><div className="rp-supporting">{['experience','education','skills','writing','now'].includes(section.type) && section.content.items?.map((item,index) => <article key={index}><ItemTitle item={item} interactive={interactive} />{item.description && <p className="rp-copy">{item.description}</p>}<Tags tags={item.tags} /></article>)}</div><Tags tags={section.content.tags} />{section.type === 'contact' && <Action section={section} interactive={interactive} />}</>;
}
export function DemoNote({ children }: { children?: ReactNode }) { return <p className="rp-demo-note">{children ?? 'Interactive example · Local sample data · No external requests'}</p>; }
