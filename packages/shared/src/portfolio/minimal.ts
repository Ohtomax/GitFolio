import { TemplateSchema } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, entry, itemsFor, art, action, metrics, tags, navigation, type PortfolioDocument } from './tree.js';

export const minimalTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000001', name: 'The Modern Minimalist', category: 'minimal', isReact: false, thumbnailUrl: null,
  description: 'A precise, spacious portfolio that puts product impact, thoughtful engineering, and shipped work first.',
  defaultConfig: {
    theme: { layout: 'minimal', demo: true, colors: { background: '#FAFAFA', text: '#111113', accent: '#1D4ED8', muted: '#62626B', surface: '#FFFFFF', border: '#D8D8DF' }, font: 'sans', headingFont: 'sans', spacing: 'spacious' },
    sections: [
      { type: 'hero', visible: true, content: { eyebrow: 'Alex Rivera / Product engineer', heading: 'Complex products. Effortless experiences.', subtitle: 'Frontend & full-stack engineer · Lisbon, Portugal',
        description: 'I bring clarity to ambitious web products — from the first interaction to the systems that keep them fast. Currently building tools that give teams their time back.',
        buttonLabel: 'Let’s talk about your product ↗', buttonUrl: 'mailto:alex@example.com', tags: ['React', 'TypeScript', 'Node.js'],
        metrics: [{ value: '38%', label: 'Faster onboarding' }, { value: '12', label: 'Products shipped' }, { value: '6 years', label: 'Turning ideas into interfaces' }] } },
      { type: 'projects', visible: true, content: { heading: 'A few things I’ve shipped.', description: 'Selected work at the intersection of useful, usable, and well built.', items: [
        { title: 'Atlas — a calmer workspace', subtitle: 'Product engineering · 2026', description: 'Rebuilt a fragmented operations dashboard around the decisions people make every day. Cut first-run setup from 13 steps to 5.', url: 'https://example.com/atlas', visual: 'dashboard', tags: ['React', 'PostgreSQL', 'Design systems'] },
        { title: 'Relay — less waiting, more doing', subtitle: 'Full-stack engineering · 2025', description: 'A background-job console that makes slow tasks observable. Designed resilient queues, clear failure states, and one-click recovery.', url: 'https://example.com/relay', visual: 'code', tags: ['TypeScript', 'Redis', 'Node.js'] },
      ] } },
      { type: 'skills', visible: true, content: { heading: 'The right tools. Used well.', description: 'A focused stack, with strong fundamentals underneath.', tags: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Testing Library', 'Accessibility', 'Performance'], items: [
        { title: 'Interface craft', description: 'Accessible components, resilient state, and details that make complex workflows feel obvious.' },
        { title: 'Product systems', description: 'Typed APIs, relational data models, and observable background work.' },
      ] } },
      { type: 'experience', visible: true, content: { heading: 'Built with good teams.', description: '', items: [
        { title: 'Senior Product Engineer · Northstar Labs', subtitle: '2023 — Present', description: 'Own the frontend platform and partner with design to turn customer research into focused, measurable releases.' },
        { title: 'Software Engineer · Common Ground', subtitle: '2020 — 2023', description: 'Shipped collaboration tools, introduced component testing, and made the core workflow usable with a keyboard.' },
      ] } },
      { type: 'about', visible: true, content: { heading: 'Care is a technical skill.', description: 'I’m Alex, an engineer who enjoys the space between a thoughtful design and a dependable system. I ask what people are trying to do before deciding what to build.\n\nAway from the screen, I’m usually finding a new walking route, making coffee, or learning how something works.' } },
      { type: 'contact', visible: true, content: { heading: 'Have a good problem?', subtitle: 'Let’s make something useful.', description: 'I’m interested in small, ambitious teams building products people rely on. Tell me what you’re working on — I’ll bring a considered reply.', buttonLabel: 'alex@example.com ↗', buttonUrl: 'mailto:alex@example.com', tags: ['Open to thoughtful collaborations'] } },
    ],
  },
});

export function renderMinimal(document: PortfolioDocument) {
  const sections = document.sections.filter((s) => s.visible);
  const hero = sections.find((s) => s.type === 'hero');
  const header = el('header', 'pf-header', [el('p', 'pf-brand', [hero?.content.eyebrow || 'Portfolio', el('span', '', [hero?.content.subtitle || 'Selected work & ideas'])]), navigation(sections)]);
  return pageFrame(document, main(sections.map((section) => {
    const c = section.content;
    if (section.type === 'hero') return sectionShell(section, [el('p', 'pf-eyebrow', ['Thoughtful engineering. Measurable impact.']), ...sectionHeading(section), action(c), tags(c.tags), metrics(c)].filter((node) => node !== undefined), 'pf-minimal-hero');
    if (section.type === 'projects') return sectionShell(section, [...sectionHeading(section), el('div', 'pf-minimal-projects', itemsFor(section).map((item) =>
      el('article', 'pf-minimal-project', [item.visual && art(item.visual), entry(item)])))]);
    return sectionShell(section, [...sectionHeading(section), ...(c.subtitle ? [el('p', 'pf-subtitle', [c.subtitle])] : []),
      ...(c.tags?.length ? [tags(c.tags)!] : []), ...(itemsFor(section).length ? [el('div', 'pf-entries', itemsFor(section).map((item) => entry(item)))] : []),
      ...(action(c) && section.type === 'contact' ? [action(c)!] : [])]);
  })), '', header);
}
export const MINIMAL_CSS = `
.pf-minimal .pf-header{border-bottom:1px solid var(--pf-border)}.pf-minimal .pf-main{max-width:1160px}.pf-minimal .pf-hero{padding-top:calc(var(--pf-space)*1.6);padding-bottom:calc(var(--pf-space)*1.3)}
.pf-minimal .pf-hero .pf-description{max-width:55ch}.pf-minimal .pf-hero .pf-tags{display:inline-flex;margin-left:1.5rem!important}.pf-minimal .pf-metrics{max-width:680px;padding-top:2rem;border-top:1px solid var(--pf-border)}
.pf-minimal-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem;margin-top:2rem}.pf-minimal-project{border:1px solid var(--pf-border);border-radius:8px;overflow:hidden;background:var(--pf-surface)}.pf-minimal-project .pf-entry{padding:1.5rem}.pf-minimal-project .pf-art{min-height:210px}.pf-minimal .pf-skills .pf-entries,.pf-minimal .pf-experience .pf-entries{grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem}.pf-minimal .pf-experience .pf-entry{border-left:2px solid var(--pf-border);padding-left:1.5rem}
.pf-minimal .pf-about{display:grid;grid-template-columns:1fr 1.3fr;gap:3rem}.pf-minimal .pf-about .pf-description{margin-top:0}.pf-minimal .pf-contact{padding-block:calc(var(--pf-space)*1.4);border-bottom:0}.pf-minimal .pf-contact h2{font-size:clamp(2rem,4cqi,3.5rem)}
@container(max-width:620px){.pf-minimal-projects,.pf-minimal .pf-skills .pf-entries,.pf-minimal .pf-experience .pf-entries,.pf-minimal .pf-about{grid-template-columns:1fr;gap:1.5rem}.pf-minimal .pf-hero .pf-tags{display:flex;margin-left:0!important}}
`;
