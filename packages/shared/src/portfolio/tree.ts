import { PortfolioUrlSchema } from '../validation/section-content.schema.js';
import type { EditorSection, EditorItem, SectionContent } from '../validation/editor.schema.js';
import type { ThemeConfig } from '../validation/template.schema.js';

// A small semantic tree keeps React previews and both export formats identical.
// Only application code chooses tags/attributes; user content is always a text node.
export type PortfolioTag = 'div' | 'header' | 'nav' | 'main' | 'section' | 'article' | 'aside' | 'footer' | 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'a' | 'ul' | 'ol' | 'li' | 'dl' | 'dt' | 'dd' | 'details' | 'summary' | 'form' | 'label' | 'input' | 'button' | 'table' | 'caption' | 'thead' | 'tbody' | 'tr' | 'th' | 'td' | 'code' | 'strong';
export interface PortfolioElement { tag: PortfolioTag; attrs: Record<string, string>; children: PortfolioNode[] }
export type PortfolioNode = PortfolioElement | string;
export interface PortfolioDocument { themeConfig: ThemeConfig; sections: Array<EditorSection & { sortOrder?: number }> }
export const el = (tag: PortfolioTag, className: string, children: Array<PortfolioNode | undefined | false>, attrs: Record<string, string> = {}): PortfolioElement =>
  ({ tag, attrs: { ...(className ? { class: className } : {}), ...attrs }, children: children.filter((node): node is PortfolioNode => node !== undefined && node !== false) });
export const text = (value?: string) => value || undefined;
export function link(url: string | undefined, label: string, className = ''): PortfolioElement {
  const safe = PortfolioUrlSchema.safeParse(url ?? '');
  return safe.success && safe.data ? el('a', className, [label], { href: safe.data, target: '_blank', rel: 'noopener noreferrer' }) : el('span', className, [label]);
}
export const sectionNames = { hero: 'Hero', about: 'About', projects: 'Projects', skills: 'Skills', experience: 'Experience', education: 'Education', contact: 'Contact', writing: 'Writing', now: 'Now' } as const;
export const itemsFor = (section: EditorSection) => ['projects', 'skills', 'experience', 'education', 'writing', 'now'].includes(section.type) ? section.content.items ?? [] : [];
export function sectionShell(section: EditorSection, children: PortfolioNode[], className = ''): PortfolioElement {
  return el('section', `pf-section pf-${section.type} ${className}`, children,
    { id: `portfolio-${section.id}`, 'data-section-id': section.id, 'data-section-type': section.type,
      'aria-label': `${sectionNames[section.type]} portfolio section` });
}
export function sectionHeading(section: EditorSection, index?: number): PortfolioElement[] {
  return [el('div', 'pf-section-label', [index !== undefined && el('span', 'pf-index', [String(index).padStart(2, '0')]),
    el(section.type === 'hero' ? 'h1' : 'h2', '', [section.content.heading || sectionNames[section.type]])]),
    ...(section.content.description ? [el('p', 'pf-description', [section.content.description])] : [])];
}
export function tags(values: string[] | undefined): PortfolioElement | undefined {
  return values?.length ? el('ul', 'pf-tags', values.map((value) => el('li', '', [value]))) : undefined;
}
export function metrics(content: SectionContent): PortfolioElement | undefined {
  return content.metrics?.length ? el('dl', 'pf-metrics', content.metrics.map((metric) => el('div', '', [el('dt', '', [metric.label]), el('dd', '', [metric.value])]))) : undefined;
}
export function action(content: SectionContent): PortfolioElement | undefined {
  return content.buttonLabel ? link(content.buttonUrl, content.buttonLabel, 'pf-action') : undefined;
}
export function entry(item: EditorItem, className = ''): PortfolioElement {
  return el('article', `pf-entry ${className}`, [el('h3', '', [link(item.url, item.title || 'Untitled entry')]),
    item.subtitle && el('p', 'pf-meta', [item.subtitle]), item.description && el('p', 'pf-description', [item.description]), tags(item.tags)]);
}
export function art(visual: EditorItem['visual'] = 'dashboard'): PortfolioElement {
  const shapes = visual === 'typography' ? [el('span', 'pf-art-glyph', ['Aa']), el('span', 'pf-art-caption', ['FORM / FUNCTION'])]
    : Array.from({ length: visual === 'mobile' ? 3 : 6 }, (_, i) => el('span', `pf-art-block pf-art-block-${i}`, []));
  return el('div', `pf-art pf-art-${visual}`, shapes, { 'aria-hidden': 'true' });
}
export function pageFrame(document: PortfolioDocument, body: PortfolioElement, className = '', header?: PortfolioElement): PortfolioElement {
  return el('div', `pf-page pf-${document.themeConfig.layout ?? 'classic'} ${className}`, [
    el('a', 'pf-skip', ['Skip to content'], { href: '#portfolio-content' }), header,
    body, el('footer', 'pf-footer', [el('span', '', ['Built with care.']),
      document.themeConfig.demo && el('span', 'pf-demo', ['Illustrative portfolio · Example identities, work & metrics'])])]);
}
export function navigation(sections: EditorSection[], className = ''): PortfolioElement {
  return el('nav', `pf-nav ${className}`, sections.filter((s) => s.type !== 'hero').map((s) =>
    el('a', '', [sectionNames[s.type]], { href: `#portfolio-${s.id}` })), { 'aria-label': 'Portfolio sections' });
}
export const main = (children: PortfolioNode[], className = '') => el('main', `pf-main ${className}`, children, { id: 'portfolio-content', tabindex: '-1' });
export function serializePortfolioTree(node: PortfolioNode): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  if (typeof node === 'string') return escape(node);
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  return `<${node.tag}${attrs}>${node.tag === 'input' ? '' : node.children.map(serializePortfolioTree).join('') + `</${node.tag}>`}`;
}
