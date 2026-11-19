import { TemplateSchema } from '../validation/template.schema.js';
import { isPortfolioImageUrl } from '../validation/section-content.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, entry, itemsFor, art, action, metrics, tags, navigation, link,
  type PortfolioDocument, type PortfolioElement } from './tree.js';

export const obsidianTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000e',
  name: 'Obsidian / Developer Journal', category: 'premium', isReact: false, thumbnailUrl: null,
  description: 'A dark developer portfolio inspired by kroszborg.co, with a sticky personal profile, floating navigation, expandable experience, visual project cards, and a technical journal.',
  defaultConfig: {
    theme: { layout: 'obsidian', demo: true, font: 'sans', headingFont: 'sans', spacing: 'comfortable',
      colors: { background: '#0b0b0d', surface: '#17171b', text: '#f5f5f7', muted: '#ababba', accent: '#c4b5fd', border: '#303037' } },
    sections: [
      { type: 'hero', visible: true, content: {
        eyebrow: 'Building for the web', heading: 'Alex Morgan', subtitle: 'Full-stack developer',
        description: 'I turn interesting problems into useful web applications. I care about thoughtful interfaces, dependable systems, and sharing what I learn along the way.',
        portraitUrl: '', portraitAlt: 'Alex Morgan', buttonLabel: 'Get in touch', buttonUrl: 'mailto:alex@example.com',
        tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      } },
      { type: 'experience', visible: true, content: {
        heading: 'Experience', description: 'Where I’ve been building, learning, and contributing.',
        items: [
          { title: 'Northstar Studio', subtitle: 'Full-stack developer · 2024 — Present · Remote',
            description: 'Build a shared workspace for small creative teams, from accessible React interfaces to typed APIs and relational data models.\n\nRecent work includes a reusable component library, a clearer onboarding flow, and background jobs that keep longer tasks out of the request path.',
            tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'], url: 'https://example.com/northstar' },
          { title: 'Common Ground', subtitle: 'Frontend developer · 2022 — 2024',
            description: 'Worked with designers and product teams on a community publishing platform. Built responsive reading and editing experiences, improved keyboard navigation, and introduced focused component tests.',
            tags: ['React', 'CSS', 'Accessibility', 'Testing'], url: 'https://example.com/common-ground' },
          { title: 'Small Hours Lab', subtitle: 'Software development intern · 2021 — 2022',
            description: 'Prototyped internal tools, wrote documentation, and learned how to turn a small feature into a maintainable part of a larger application.',
            tags: ['JavaScript', 'HTML & CSS', 'Git'], url: 'https://example.com/small-hours' },
        ],
      } },
      { type: 'projects', visible: true, content: {
        heading: 'Projects', description: 'A few ideas I’ve taken from a sketch to a working prototype.',
        items: [
          { title: 'Folio', subtitle: 'A calmer workspace', visual: 'dashboard',
            description: 'A project hub for independent teams. Notes, tasks, and decisions live together so the next step is always easy to find.',
            tags: ['React', 'TypeScript', 'PostgreSQL'], url: 'https://example.com/folio' },
          { title: 'Relay', subtitle: 'Small services, clear contracts', visual: 'architecture',
            description: 'A developer toolkit for exploring background tasks, delivery receipts, and recoverable failures through one consistent interface.',
            tags: ['Node.js', 'Redis', 'Docker'], url: 'https://example.com/relay' },
          { title: 'Pocket Notes', subtitle: 'An idea, wherever you are', visual: 'mobile',
            description: 'An offline-friendly notebook with quick capture, searchable tags, and a reading view that gets out of the way.',
            tags: ['React', 'IndexedDB', 'PWA'], url: 'https://example.com/pocket-notes' },
          { title: 'Typecraft', subtitle: 'A little room to experiment', visual: 'typography',
            description: 'An interactive playground for testing type scales, spacing, and readable color combinations before building a new interface.',
            tags: ['TypeScript', 'CSS', 'Accessibility'], url: 'https://example.com/typecraft' },
        ],
      } },
      { type: 'writing', visible: true, content: {
        heading: 'Writing', description: 'Notes from the space between an idea and its implementation.',
        items: [
          { title: 'Making background work feel immediate', subtitle: 'November 2026 · 6 min read', visual: 'architecture',
            description: 'Progress, retries, and the small interface decisions that help people trust a task they cannot see.',
            tags: ['Queues', 'UX', 'Node.js'], url: 'https://example.com/writing/background-work' },
          { title: 'A component API is a conversation', subtitle: 'October 2026 · 5 min read', visual: 'code',
            description: 'What a few ordinary form controls taught me about defaults, composition, and leaving room for the next use case.',
            tags: ['React', 'TypeScript', 'Design systems'], url: 'https://example.com/writing/component-api' },
        ],
      } },
      { type: 'about', visible: true, content: {
        heading: 'A little about me', subtitle: 'Curious about how things work. Even more curious about who they help.',
        description: 'I’m Alex, a developer who enjoys working across the whole product. I like asking questions, building a small version, and learning from the people who use it.\n\nThis journal is a place for the projects, experiments, and lessons I want to keep. Away from a screen, I’m usually walking somewhere new, reading, or making another overambitious weekend plan.',
      } },
      { type: 'skills', visible: true, content: {
        heading: 'Tools I reach for', description: 'A practical toolkit, with room to keep learning.',
        tags: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Redis', 'Docker', 'Git', 'Testing', 'Accessibility'],
        items: [
          { title: 'Interface to infrastructure', description: 'Accessible components, typed APIs, relational data, background tasks, and a clear path from local development to deployment.' },
        ],
      } },
      { type: 'now', visible: true, content: {
        heading: 'Beyond the commits', description: 'A few things that keep the curiosity going.',
        items: [
          { title: 'Learning in public', subtitle: 'An ongoing notebook', description: 'Experiments, useful mistakes, and the ideas I’m still working through.', url: 'https://example.com/journal' },
          { title: 'My everyday setup', subtitle: 'Tools and working habits', description: 'A short list of the things that make a day of building a little better.', url: 'https://example.com/setup' },
        ],
      } },
      { type: 'contact', visible: true, content: {
        heading: 'Have a good problem in mind?', subtitle: 'Let’s make something useful.',
        description: 'I’m always glad to hear about thoughtful projects, interesting technical questions, or a good reason to collaborate.',
        buttonLabel: 'Start a conversation', buttonUrl: 'mailto:alex@example.com',
        items: [
          { title: 'Resume', url: 'https://example.com/alex/resume' },
          { title: 'GitHub', url: 'https://example.com/alex/code' },
          { title: 'LinkedIn', url: 'https://example.com/alex/profile' },
          { title: 'Email', url: 'mailto:alex@example.com' },
        ],
      } },
    ],
  },
});

export function renderObsidian(document: PortfolioDocument): PortfolioElement {
  const sections = document.sections.filter((section) => section.visible);
  const hero = sections.find((section) => section.type === 'hero');
  const contact = sections.find((section) => section.type === 'contact');
  const name = hero?.content.heading || 'Your portfolio';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const navSections = sections.filter((section) => ['experience', 'projects', 'writing'].includes(section.type));
  const header = el('header', 'pf-obsidian-header', [
    el('div', 'pf-obsidian-dock', [
      el('a', 'pf-obsidian-brand', [el('span', 'pf-obsidian-monogram', [initials], { 'aria-hidden': 'true' }),
        el('span', 'pf-obsidian-brand-name', [name.trim().split(/\s+/)[0]])], { href: '#portfolio-content', 'aria-label': `${name} home` }),
      navigation(navSections.length ? navSections : sections.filter((section) => section.type !== 'hero').slice(0, 3)),
    ]),
  ]);
  const renderSection = (section: PortfolioDocument['sections'][number]): PortfolioElement => {
    const c = section.content;
    if (section.type === 'hero') {
      const portrait = c.portraitUrl?.trim();
      return sectionShell(section, [
        el('div', 'pf-obsidian-portrait', [el('span', '', [initials], { 'aria-hidden': 'true' }),
          portrait && isPortfolioImageUrl(portrait) ? el('img', '', [], { src: portrait, alt: c.portraitAlt || name,
            width: '96', height: '96', decoding: 'async', referrerpolicy: 'no-referrer' }) : undefined,
        ]),
        ...(c.eyebrow ? [el('p', 'pf-eyebrow', [c.eyebrow])] : []), el('h1', '', [c.heading]),
        ...(c.subtitle ? [el('p', 'pf-obsidian-role', [c.subtitle])] : []), ...(c.description ? [el('p', 'pf-description', [c.description])] : []),
        ...(tags(c.tags) ? [tags(c.tags)!] : []), ...(action(c) ? [action(c)!] : []), ...(metrics(c) ? [metrics(c)!] : []),
        ...(contact?.content.items?.length ? [el('nav', 'pf-obsidian-socials', contact.content.items.map((item) => link(item.url, item.title)), { 'aria-label': 'Profile links' })] : []),
      ], 'pf-obsidian-profile');
    }
    if (section.type === 'experience') return sectionShell(section, [...sectionHeading(section),
      el('div', 'pf-obsidian-experiences', itemsFor(section).map((item, index) =>
        el('details', 'pf-obsidian-experience', [
          el('summary', '', [el('span', 'pf-obsidian-company-mark', [item.title.trim().slice(0, 1)], { 'aria-hidden': 'true' }),
            el('span', 'pf-obsidian-company', [el('strong', '', [item.title]), item.subtitle && el('span', 'pf-meta', [item.subtitle])]),
            el('span', 'pf-obsidian-disclosure', ['Details']),
          ]),
          el('div', 'pf-obsidian-experience-body', [
            item.tags?.length ? el('p', 'pf-obsidian-caption', ['Technologies & tools']) : undefined, tags(item.tags),
            item.description && el('p', 'pf-description', [item.description]),
            item.url && link(item.url, `${item.title} website`, 'pf-obsidian-text-link'),
          ]),
        ], index === 0 ? { open: 'open' } : {}))),
    ]);
    if (section.type === 'projects' || section.type === 'writing') return sectionShell(section, [...sectionHeading(section),
      el('div', 'pf-obsidian-cards', itemsFor(section).map((item) =>
        el('article', `pf-entry pf-obsidian-card pf-obsidian-${section.type === 'writing' ? 'post' : 'project'}`, [
          art(item.visual || (section.type === 'writing' ? 'code' : 'dashboard')),
          el('div', 'pf-obsidian-card-body', [
            item.subtitle && el('p', 'pf-meta', [item.subtitle]), el('h3', '', [link(item.url, item.title || 'Untitled entry')]),
            item.description && el('p', 'pf-description', [item.description]), tags(item.tags),
            item.url && link(item.url, section.type === 'writing' ? `Read ${item.title}` : `Explore ${item.title}`, 'pf-obsidian-text-link'),
          ]),
        ]))),
    ]);
    if (section.type === 'contact') return sectionShell(section, [
      el('div', 'pf-obsidian-contact-panel', [
        ...sectionHeading(section), c.subtitle && el('p', 'pf-subtitle', [c.subtitle]), action(c),
        c.items?.length ? el('nav', 'pf-obsidian-socials', c.items.map((item) => link(item.url, item.title)), { 'aria-label': 'Contact links' }) : undefined,
      ]),
    ]);
    return sectionShell(section, [...sectionHeading(section),
      ...(c.subtitle ? [el('p', 'pf-subtitle', [c.subtitle])] : []), ...(tags(c.tags) ? [tags(c.tags)!] : []),
      ...(itemsFor(section).length ? [el('div', 'pf-obsidian-list', itemsFor(section).map((item) => entry(item)))] : []),
    ]);
  };
  return pageFrame(document, main([
    ...(hero ? [renderSection(hero)] : []),
    el('div', 'pf-obsidian-content', sections.filter((section) => section !== hero).map(renderSection)),
  ], `pf-obsidian-grid${hero ? '' : ' pf-obsidian-no-profile'}`), '', header);
}

export const OBSIDIAN_CSS = `
.pf-obsidian{position:relative;min-height:100vh;background:var(--pf-bg)}
.pf-obsidian::before{content:'';position:absolute;inset:0 0 auto;height:800px;z-index:-1;pointer-events:none;background:repeating-radial-gradient(ellipse at 8% 22%,transparent 0 23px,color-mix(in srgb,var(--pf-muted) 5%,transparent) 24px 25px,transparent 27px 41px),repeating-radial-gradient(ellipse at 92% 18%,transparent 0 37px,color-mix(in srgb,var(--pf-accent) 4%,transparent) 38px 39px,transparent 41px 60px);mask-image:linear-gradient(#000,transparent)}
.pf-obsidian-header{position:sticky;top:0;z-index:20;max-width:1120px;margin:auto;padding:1.25rem 2rem;pointer-events:none}
.pf-obsidian-dock{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;max-width:920px;margin:auto;padding:.5rem 1.25rem;border:1px solid var(--pf-border);border-radius:1.25rem;background:color-mix(in srgb,var(--pf-bg) 92%,transparent);backdrop-filter:blur(18px);box-shadow:0 8px 30px #00000024;pointer-events:auto}
.pf-obsidian-brand{display:inline-flex;align-items:center;gap:.65rem;min-height:44px;font-size:1rem;font-weight:650}
.pf-obsidian-monogram{display:grid;place-items:center;width:30px;height:30px;border:1px solid color-mix(in srgb,var(--pf-accent) 45%,var(--pf-border));border-radius:9px;background:color-mix(in srgb,var(--pf-accent) 12%,var(--pf-bg));color:var(--pf-accent);font-size:.75rem}
.pf-obsidian .pf-nav{gap:.25rem 1.5rem;font-size:.875rem;color:var(--pf-muted)}.pf-obsidian .pf-nav a:hover{color:var(--pf-text)}
.pf-obsidian-grid{display:grid;grid-template-columns:230px minmax(0,1fr);gap:4rem;align-items:start;max-width:1120px;padding:2rem 2rem 3rem}.pf-obsidian-no-profile{grid-template-columns:minmax(0,1fr);max-width:840px}
.pf-obsidian .pf-section{padding-block:var(--pf-space);scroll-margin-top:7rem}.pf-obsidian .pf-section-label{gap:0}.pf-obsidian h2{font-size:1.35rem;line-height:1.4;letter-spacing:-.035em}.pf-obsidian h3{font-size:1.075rem;letter-spacing:-.025em;line-height:1.5}
.pf-obsidian .pf-description{font-size:1rem;line-height:1.8;max-width:none;margin-top:1rem}.pf-obsidian .pf-meta{font-size:.875rem;line-height:1.6}.pf-obsidian .pf-subtitle{font-size:1rem}
.pf-obsidian .pf-obsidian-profile{position:sticky;top:7rem;align-self:start;border:0;padding:1.25rem 0 2rem}.pf-obsidian-portrait{position:relative;display:grid;place-items:center;width:88px;height:88px;overflow:hidden;border:1px solid color-mix(in srgb,var(--pf-accent) 40%,var(--pf-border));border-radius:50%;background:radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--pf-accent) 24%,var(--pf-surface)),var(--pf-surface));color:var(--pf-accent);font:600 1.75rem var(--pf-heading-font);margin-bottom:1.75rem}.pf-obsidian-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pf-obsidian-profile .pf-eyebrow{font-size:.75rem;letter-spacing:.08em;margin-bottom:.75rem}.pf-obsidian .pf-obsidian-profile h1{font-size:2.65rem;line-height:1.12;letter-spacing:-.055em;max-width:10ch;white-space:pre-wrap}.pf-obsidian-role{margin-top:.6rem!important;color:var(--pf-muted);font-size:1.05rem}.pf-obsidian .pf-obsidian-profile .pf-description{margin-top:1.5rem;font-size:1rem}.pf-obsidian .pf-tags{gap:.4rem;margin-top:1.25rem!important}.pf-obsidian .pf-tags li{font-size:.875rem;padding:.2rem .5rem;border-radius:6px;color:var(--pf-text);line-height:1.5}
.pf-obsidian .pf-action{margin-top:1.5rem;border-radius:9px;font-size:.875rem;min-height:44px;padding:.65rem 1rem}.pf-obsidian-socials{display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin-top:1rem;color:var(--pf-muted);font-size:.875rem}.pf-obsidian-socials a,.pf-obsidian-text-link{display:inline-flex;align-items:center;min-height:44px}.pf-obsidian .pf-metrics{grid-template-columns:1fr;gap:1rem;margin-top:1.5rem!important}.pf-obsidian .pf-metrics dd{font-size:1.25rem}.pf-obsidian .pf-metrics dt{font-size:.875rem}
.pf-obsidian-experiences{margin-top:1.5rem}.pf-obsidian-experience{border-top:1px solid var(--pf-border)}.pf-obsidian-experience:first-child{border-top:0}.pf-obsidian-experience summary{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1.25rem 0;list-style:none;min-height:72px}.pf-obsidian-experience summary::-webkit-details-marker{display:none}.pf-obsidian-company-mark{display:grid;place-items:center;width:44px;height:44px;border:1px solid var(--pf-border);border-radius:10px;background:var(--pf-surface);color:var(--pf-accent);font-size:1.15rem;font-weight:600}.pf-obsidian-company{min-width:0}.pf-obsidian-company strong{display:block;font-size:1.05rem;font-weight:600}.pf-obsidian-company .pf-meta{display:block;margin-top:.25rem}.pf-obsidian-disclosure{display:flex;align-items:center;gap:.6rem;color:var(--pf-muted);font-size:.875rem}.pf-obsidian-disclosure::after{content:'+';font-size:1.25rem;line-height:1}.pf-obsidian-experience[open] .pf-obsidian-disclosure::after{content:'−'}.pf-obsidian-experience-body{padding:.5rem 0 1.25rem}.pf-obsidian-caption{font-size:.875rem;font-weight:550}.pf-obsidian-experience-body .pf-tags{margin-top:.6rem!important}
.pf-obsidian-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1.75rem}.pf-obsidian-card{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--pf-border);border-radius:14px;background:var(--pf-surface);transition:border-color .2s,transform .2s}.pf-obsidian-card:hover{border-color:color-mix(in srgb,var(--pf-accent) 60%,var(--pf-border));transform:translateY(-3px)}.pf-obsidian-card .pf-art{min-height:165px;height:165px;padding:25px;gap:7px;background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--pf-accent) 18%,var(--pf-bg)),transparent 65%),var(--pf-bg)}.pf-obsidian-card:nth-child(even) .pf-art{background:radial-gradient(ellipse at 100% 100%,color-mix(in srgb,var(--pf-accent) 18%,var(--pf-bg)),transparent 65%),var(--pf-bg)}.pf-obsidian-card .pf-art-block{min-height:22px}.pf-obsidian-card .pf-art-block:first-child{min-height:45px;background:color-mix(in srgb,var(--pf-accent) 45%,var(--pf-surface))}.pf-obsidian-card .pf-art-block:nth-child(2){min-height:82px}.pf-obsidian-card .pf-art-block:nth-child(4){background:color-mix(in srgb,var(--pf-accent) 22%,var(--pf-surface))}.pf-obsidian-card .pf-art-mobile .pf-art-block{min-height:105px}.pf-obsidian-card .pf-art-code .pf-art-block{min-height:0;height:8px}.pf-obsidian-card .pf-art-glyph{font-size:76px}.pf-obsidian-card .pf-art-architecture .pf-art-block:first-child{min-height:28px}
.pf-obsidian-card-body{display:flex;flex:1;flex-direction:column;padding:1.2rem}.pf-obsidian-card-body>.pf-meta{margin:0 0 .5rem}.pf-obsidian-card .pf-description{font-size:1rem;line-height:1.7;margin-top:.7rem}.pf-obsidian-card .pf-tags{margin-bottom:1rem}.pf-obsidian-text-link{align-self:flex-start;color:var(--pf-accent)!important;font-size:.875rem;font-weight:500;margin-top:.75rem}.pf-obsidian-card .pf-obsidian-text-link{margin-top:auto;padding-top:.5rem}
.pf-obsidian-list{display:grid;gap:1.5rem;margin-top:1.75rem}.pf-obsidian-list .pf-entry+.pf-entry{border-top:1px solid var(--pf-border);padding-top:1.5rem}.pf-obsidian .pf-contact{border:0}.pf-obsidian-contact-panel{padding:2rem;border:1px solid var(--pf-border);border-radius:16px;background:var(--pf-surface)}.pf-obsidian-contact-panel h2{font-size:1.6rem}.pf-obsidian .pf-footer{max-width:1120px;font-size:.875rem;padding:1rem 2rem 2.5rem}
@container(max-width:850px){.pf-obsidian-grid{grid-template-columns:200px minmax(0,1fr);gap:2rem;padding-inline:1.5rem}.pf-obsidian-no-profile{grid-template-columns:minmax(0,1fr)}.pf-obsidian .pf-obsidian-profile h1{font-size:2.25rem}.pf-obsidian-cards{grid-template-columns:1fr}}
@container(max-width:650px){.pf-obsidian-header{padding:1rem}.pf-obsidian-dock{gap:1rem;padding:.4rem .75rem;border-radius:1rem}.pf-obsidian .pf-nav{gap:.25rem 1rem}.pf-obsidian-grid{grid-template-columns:minmax(0,1fr);gap:0;padding:0 1.25rem 1rem}.pf-obsidian .pf-obsidian-profile{position:relative;top:auto;padding:2rem 0 2.5rem;border-bottom:1px solid var(--pf-border)}.pf-obsidian .pf-obsidian-profile h1{font-size:2.65rem;max-width:none}.pf-obsidian-portrait{width:80px;height:80px;margin-bottom:1.25rem}.pf-obsidian .pf-section{scroll-margin-top:6.5rem}.pf-obsidian-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.pf-obsidian .pf-footer{padding-inline:1.25rem}.pf-obsidian-contact-panel{padding:1.5rem}.pf-obsidian .pf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container(max-width:480px){.pf-obsidian-brand-name{display:none}.pf-obsidian .pf-nav{gap:.25rem .85rem}.pf-obsidian-cards{grid-template-columns:1fr}.pf-obsidian-card .pf-art{height:185px}.pf-obsidian-experience summary{grid-template-columns:40px minmax(0,1fr) 16px;gap:.75rem}.pf-obsidian-company-mark{width:40px;height:40px}.pf-obsidian-disclosure{font-size:0;gap:0}.pf-obsidian-company .pf-meta{font-size:.875rem}}
`;
