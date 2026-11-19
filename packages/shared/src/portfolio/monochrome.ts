import { TemplateSchema } from '../validation/template.schema.js';
import { isPortfolioImageUrl } from '../validation/section-content.schema.js';
import { el, main, pageFrame, sectionShell, entry, itemsFor, art, action, metrics, tags, navigation,
  type PortfolioDocument, type PortfolioElement } from './tree.js';

export const monochromeTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000b',
  name: 'Monochrome / Online CV', category: 'developer', isReact: false, thumbnailUrl: null,
  description: 'Inspired by the OnlineCv portfolio: bold black-and-white typography, a glass portrait frame, constellation details, a moving toolkit strip, and spacious project stories.',
  defaultConfig: {
    theme: { layout: 'monochrome', demo: true, font: 'sans', headingFont: 'sans', spacing: 'spacious',
      colors: { background: '#050505', surface: '#101012', text: '#fafafa', muted: '#a1a1aa', accent: '#ffffff', border: '#303034' } },
    sections: [
      { type: 'hero', visible: true, content: {
        eyebrow: 'Jordan Avery / Full-Stack Developer', heading: 'Thoughtful\ndigital experiences.',
        subtitle: 'React & TypeScript interfaces. Node.js APIs. Cloud delivery.',
        description: 'Hey, I’m Jordan. A developer who brings ideas to life with considered interfaces, dependable APIs, and the curiosity to keep learning. I enjoy making the complicated feel simple.',
        buttonLabel: 'Let’s talk', buttonUrl: 'mailto:jordan@example.com', portraitUrl: '', portraitAlt: 'Jordan Avery',
        tags: ['React & TypeScript', 'Node.js · Express · Prisma', 'PostgreSQL', 'Cloud infrastructure', 'Accessible interfaces'],
        metrics: [{ value: 'Remote', label: 'Based in' }, { value: 'Full-stack', label: 'Focus' }, { value: 'Open', label: 'Collaborations' }],
      } },
      { type: 'projects', visible: true, content: {
        heading: 'A few things\nI’ve built.', subtitle: 'Selected work',
        description: 'From the first sketch to the last deployment, I like building things that make an idea tangible.',
        items: [
          { title: 'Wayfinder', subtitle: 'WEB APPLICATION', visual: 'dashboard',
            description: 'A shared planning space that turns scattered ideas into clear next steps. I designed the interface and built the API, authentication, and collaborative workspace.',
            url: 'https://example.com/wayfinder', tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] },
          { title: 'Form & Field', subtitle: 'FRONTEND DEVELOPMENT', visual: 'typography',
            description: 'A responsive storefront for an independent studio, with a considered product gallery, accessible navigation, and a lightweight checkout flow.',
            url: 'https://example.com/form-and-field', tags: ['React', 'CSS', 'Accessibility', 'Vite'] },
        ],
      } },
      { type: 'about', visible: true, content: {
        heading: 'Curious by nature.\nDeveloper by choice.', subtitle: 'The person behind the code',
        description: 'I’m a developer who cares about the people on the other side of the screen. I enjoy understanding how a system fits together, then making each part easier to use and maintain.\n\nMy process is practical: ask good questions, build something small, learn from real feedback, and keep improving it. Away from the keyboard, I’m usually exploring a new place or adding another idea to my sketchbook.',
      } },
      { type: 'skills', visible: true, content: {
        heading: 'The toolkit.', subtitle: 'What I build with', description: 'Tools I reach for, backed by the fundamentals that make them useful.',
        tags: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'HTML & CSS', 'Git', 'Docker', 'AWS', 'Testing', 'Accessibility'],
        items: [{ title: 'From interface to infrastructure', description: 'Component architecture, API design, relational data, automated checks, and the care needed to ship and maintain a useful product.' }],
      } },
      { type: 'experience', visible: true, content: {
        heading: 'Learning through\ndoing.', subtitle: 'Education & experience', description: 'Every project adds another perspective to how I solve problems and work with people.',
        items: [
          { title: 'Full-Stack Developer · Northline Studio', subtitle: '2024 — Present', description: 'Build and maintain web applications across the interface, API, and database. Work closely with design and product to turn a clear problem into a dependable feature.' },
          { title: 'BSc Computer Science · Westbridge College', subtitle: '2020 — 2024', description: 'Studied software engineering, databases, and human-computer interaction, with a focus on applying the fundamentals in collaborative projects.' },
        ],
      } },
      { type: 'education', visible: true, content: {
        heading: 'Always a student.', subtitle: 'Certifications & continuing learning', description: 'A few milestones in an ongoing learning habit.',
        items: [
          { title: 'Web Accessibility Foundations', subtitle: 'Example certification · 2025', url: 'https://example.com/certificates/accessibility' },
          { title: 'Cloud Architecture Fundamentals', subtitle: 'Example certification · 2025', url: 'https://example.com/certificates/cloud' },
          { title: 'Secure Software Development', subtitle: 'Example certification · 2024', url: 'https://example.com/certificates/security' },
        ],
      } },
      { type: 'contact', visible: true, content: {
        heading: 'Let’s make\nsomething good.', subtitle: 'Have an idea?',
        description: 'Have a project in mind, an interesting problem, or just a good reason to connect? I’d love to hear from you.',
        buttonLabel: 'Get in touch', buttonUrl: 'mailto:jordan@example.com',
        items: [{ title: 'Email', url: 'mailto:jordan@example.com' }, { title: 'GitHub', url: 'https://example.com/jordan/code' }, { title: 'LinkedIn', url: 'https://example.com/jordan/profile' }],
      } },
    ],
  },
});

export function renderMonochrome(document: PortfolioDocument): PortfolioElement {
  const sections = document.sections.filter((section) => section.visible);
  const hero = sections.find((section) => section.type === 'hero');
  const name = hero?.content.eyebrow?.split('/')[0].trim() || 'Your name';
  const role = hero?.content.eyebrow?.split('/').slice(1).join('/').trim() || 'Developer portfolio';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const work = sections.find((section) => section.type === 'projects');
  const heading = (value: string, level: 'h1' | 'h2') => {
    const lines = value.split('\n');
    return el(level, 'pf-monochrome-title', lines.flatMap((line, index) => {
      const last = index === lines.length - 1 ? /^(.*?)(\S+)$/.exec(line) : null;
      return [...(index ? ['\n'] : []), el('span', '', last ? [last[1], el('em', '', [last[2]])] : [line])];
    }));
  };
  const title = (section: PortfolioDocument['sections'][number]) => el('div', 'pf-monochrome-section-heading', [
    el('div', '', [section.content.subtitle && el('p', 'pf-eyebrow', [section.content.subtitle]), heading(section.content.heading, 'h2')]),
    section.content.description && el('p', 'pf-description', [section.content.description]),
  ]);
  const header = el('header', 'pf-monochrome-header', [
    el('div', 'pf-monochrome-header-inner', [
      el('a', 'pf-monochrome-brand', [el('span', 'pf-monochrome-brand-mark', [initials], { 'aria-hidden': 'true' }), name], { href: '#portfolio-content' }),
      navigation(sections, 'pf-monochrome-desktop-nav'),
      el('details', 'pf-monochrome-menu', [el('summary', '', ['Menu']), navigation(sections)], { 'data-monochrome-menu': '' }),
    ]),
  ]);
  return pageFrame(document, main(sections.map((section) => {
    const c = section.content;
    if (section.type === 'hero') {
      const portraitUrl = c.portraitUrl?.trim();
      const portrait = portraitUrl && isPortfolioImageUrl(portraitUrl)
        ? el('img', '', [], { src: portraitUrl, alt: c.portraitAlt || name, width: '360', height: '360', decoding: 'async', referrerpolicy: 'no-referrer' })
        : el('span', 'pf-monochrome-initials', [initials], { 'aria-hidden': 'true' });
      const ticker = c.tags?.length ? el('div', 'pf-monochrome-ticker', [el('div', 'pf-monochrome-ticker-track', [0, 1].map((copy) =>
        el('div', 'pf-monochrome-ticker-group', c.tags!.map((tag) => el('span', '', [tag, el('span', '', ['◈'], { 'aria-hidden': 'true' })])), copy ? { 'aria-hidden': 'true' } : {})))], { 'aria-label': 'Areas of interest' }) : undefined;
      return sectionShell(section, [
        el('canvas', 'pf-monochrome-particles', [], { 'data-monochrome-particles': '', 'aria-hidden': 'true' }),
        el('div', 'pf-monochrome-hero-grid', [
          el('div', 'pf-monochrome-hero-copy', [el('p', 'pf-eyebrow pf-monochrome-badge', ['Portfolio / ' + role]), heading(c.heading, 'h1'),
            c.subtitle && el('p', 'pf-monochrome-typebar', [el('span', '', ['>'], { 'aria-hidden': 'true' }), c.subtitle, el('span', 'pf-monochrome-cursor', ['_'], { 'aria-hidden': 'true' })]),
            el('p', 'pf-description', [c.description]),
            el('div', 'pf-monochrome-actions', [work && el('a', 'pf-action', ['Explore my work'], { href: `#portfolio-${work.id}` }), action(c)]), metrics(c),
          ]),
          el('aside', 'pf-monochrome-profile', [
            el('p', 'pf-monochrome-profile-code', ['SYS / PROFILE', el('span', '', ['◈'], { 'aria-hidden': 'true' })]),
            el('div', 'pf-monochrome-orbit pf-monochrome-orbit-outer', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-orbit pf-monochrome-orbit-inner', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-portrait', [portrait]),
            el('div', 'pf-monochrome-profile-caption', [el('span', '', [name, el('strong', '', [role])]), el('span', 'pf-monochrome-symbol', ['◈'], { 'aria-hidden': 'true' })]),
          ], { 'aria-label': `Profile of ${name}` }),
        ]), ...(ticker ? [ticker] : []),
      ]);
    }
    if (section.type === 'projects') return sectionShell(section, [title(section),
      el('div', 'pf-monochrome-project-grid', itemsFor(section).map((item) => el('article', 'pf-monochrome-project-card', [
        art(item.visual), el('div', 'pf-monochrome-project-copy', [item.subtitle && el('p', 'pf-eyebrow', [item.subtitle]), entry(item)]),
      ]))),
    ]);
    if (section.type === 'about') return sectionShell(section, [title(section), ...(tags(c.tags) ? [tags(c.tags)!] : [])]);
    if (section.type === 'skills') return sectionShell(section, [title(section), ...(tags(c.tags) ? [tags(c.tags)!] : []), ...itemsFor(section).map((item) => entry(item))]);
    if (section.type === 'contact') return sectionShell(section, [title(section), ...(action(c) ? [action(c)!] : []),
      el('div', 'pf-monochrome-contact-links', (c.items ?? []).map((item) => entry(item))),
    ]);
    return sectionShell(section, [title(section), el('div', 'pf-monochrome-history', itemsFor(section).map((item) => entry(item))), ...(tags(c.tags) ? [tags(c.tags)!] : [])]);
  }), 'pf-monochrome-main'), '', header);
}

export const MONOCHROME_CSS = `
.pf-monochrome{position:relative;background-color:var(--pf-bg);background-image:radial-gradient(ellipse at 12% 5%,color-mix(in srgb,var(--pf-accent) 7%,transparent),transparent 42%),linear-gradient(color-mix(in srgb,var(--pf-text) 3%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pf-text) 3%,transparent) 1px,transparent 1px);background-size:auto,48px 48px,48px 48px}
.pf-monochrome .pf-description{font-size:1rem;line-height:1.85}.pf-monochrome .pf-eyebrow{font:500 .8rem/1.8 'Geist Mono',ui-monospace,monospace;letter-spacing:.1em;margin-bottom:1rem}.pf-monochrome .pf-meta{font-size:.875rem}
.pf-monochrome-header{position:relative;z-index:5;border-bottom:1px solid var(--pf-border);background:color-mix(in srgb,var(--pf-bg) 88%,transparent);backdrop-filter:blur(16px)}
.pf-monochrome-header-inner{max-width:1440px;margin:auto;min-height:86px;padding:1rem clamp(1.25rem,4.2cqi,4rem);display:flex;align-items:center;justify-content:space-between;gap:1.5rem}
.pf-monochrome-brand{display:flex;align-items:center;gap:.9rem;min-width:0;font:600 .875rem/1.5 'Geist Mono',ui-monospace,monospace;letter-spacing:.07em;text-transform:uppercase}
.pf-monochrome-brand-mark{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;border-radius:10px;background:var(--pf-accent);color:var(--pf-on-accent);font:700 1.15rem/1 var(--pf-heading-font);letter-spacing:-.06em;box-shadow:0 0 24px color-mix(in srgb,var(--pf-accent) 20%,transparent)}
.pf-monochrome .pf-nav{font-size:.875rem;gap:.2rem 1.2rem;color:var(--pf-muted)}.pf-monochrome .pf-nav a:last-child{border:1px solid var(--pf-border);border-radius:8px;padding:0 1rem;color:var(--pf-text)}.pf-monochrome-menu{display:none}
.pf-monochrome-main{max-width:1440px;padding:0 clamp(1.25rem,4.2cqi,4rem);display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:3rem}
.pf-monochrome .pf-section{grid-column:1/-1;padding:var(--pf-space) 0;border-bottom:1px solid var(--pf-border)}
.pf-monochrome .pf-hero{padding-top:clamp(2rem,6cqi,5.5rem);padding-bottom:0}.pf-monochrome-hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:center;gap:6%;padding-bottom:4rem;min-height:600px}
.pf-monochrome-particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;max-width:100%}.pf-monochrome-hero-copy{min-width:0;position:relative}.pf-monochrome .pf-monochrome-badge{display:inline-flex;max-width:100%;border:1px solid var(--pf-border);background:color-mix(in srgb,var(--pf-text) 5%,transparent);border-radius:99px;padding:.4rem .9rem;font-size:.75rem}
.pf-monochrome .pf-monochrome-title{max-width:none;white-space:normal;letter-spacing:-.065em;line-height:1.08}.pf-monochrome-title>span{display:block}.pf-monochrome .pf-monochrome-title em{font-weight:400;font-style:italic;font-synthesis:style;color:var(--pf-text)}
.pf-monochrome h1.pf-monochrome-title{font-size:clamp(2.7rem,6.6cqi,6.2rem)}.pf-monochrome h2.pf-monochrome-title{font-size:clamp(2rem,3.6cqi,3.5rem)}
.pf-monochrome-typebar{font:400 .875rem/1.9 'Geist Mono',ui-monospace,monospace;display:block;color:var(--pf-muted);margin-top:1.7rem!important;min-height:3.5rem}.pf-monochrome-typebar>span:first-child{color:var(--pf-accent);margin-right:.5rem}.pf-monochrome-cursor{animation:pf-monochrome-blink 1.1s step-end infinite}
.pf-monochrome .pf-hero .pf-description{max-width:53ch;margin-top:1rem}.pf-monochrome-actions{display:flex;align-items:center;flex-wrap:wrap;gap:1.5rem;margin-top:.5rem}.pf-monochrome .pf-action{font-size:.875rem;min-height:48px;border-radius:9px;padding:.8rem 1.3rem;border:1px solid var(--pf-accent);box-shadow:0 4px 24px color-mix(in srgb,var(--pf-accent) 12%,transparent)}.pf-monochrome-actions .pf-action+ .pf-action{color:var(--pf-text)!important;background:transparent;border-color:transparent;box-shadow:none;padding:.8rem 0}
.pf-monochrome .pf-metrics{border-top:1px solid var(--pf-border);padding-top:1.5rem;gap:1rem;margin-top:2rem!important}.pf-monochrome .pf-metrics dt{font-size:.8rem}.pf-monochrome .pf-metrics dd{font-size:1.1rem;font-weight:500}
.pf-monochrome-profile{position:relative;min-width:0;aspect-ratio:1/1.08;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid color-mix(in srgb,var(--pf-text) 22%,transparent);border-radius:22px;background:linear-gradient(140deg,color-mix(in srgb,var(--pf-text) 8%,var(--pf-surface)),var(--pf-surface) 65%);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--pf-text) 10%,transparent),0 24px 65px #0004}
.pf-monochrome-profile::before{content:'';position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--pf-text) 5%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pf-text) 5%,transparent) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(#000,transparent)}
.pf-monochrome-profile-code,.pf-monochrome-profile-caption{position:absolute;left:1.6rem;right:1.6rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;z-index:2;font:400 .75rem/1.8 'Geist Mono',ui-monospace,monospace;color:var(--pf-muted);letter-spacing:.08em}.pf-monochrome-profile-code{top:1.5rem}.pf-monochrome-profile-code>span{color:var(--pf-text);font-size:1.5rem}.pf-monochrome-profile-caption{bottom:1.5rem}.pf-monochrome-profile-caption strong{display:block;font-size:.8rem;letter-spacing:.02em;font-weight:500;color:var(--pf-text)}.pf-monochrome-profile-caption .pf-monochrome-symbol{font-size:2.5rem;color:var(--pf-accent)}
.pf-monochrome-portrait{position:relative;z-index:1;width:68%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pf-text) 25%,transparent);border-radius:50%;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 35% 20%,color-mix(in srgb,var(--pf-text) 20%,var(--pf-surface)),var(--pf-bg));box-shadow:0 0 70px color-mix(in srgb,var(--pf-text) 8%,transparent)}.pf-monochrome-portrait img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(1)}.pf-monochrome-initials{font:500 clamp(3rem,10cqi,8rem)/1 var(--pf-heading-font);letter-spacing:-.08em;color:var(--pf-text)}
.pf-monochrome-orbit{position:absolute;width:88%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pf-text) 10%,transparent);border-radius:50%;transform:rotate(-25deg) scaleX(.85)}.pf-monochrome-orbit-inner{width:78%;transform:rotate(30deg) scaleX(.86);border-style:dashed}
.pf-monochrome-ticker{position:relative;overflow:hidden;border-top:1px solid var(--pf-border);border-bottom:1px solid var(--pf-border);margin:1rem 0 0;background:color-mix(in srgb,var(--pf-surface) 75%,transparent)}.pf-monochrome-ticker-track{display:flex;width:max-content;animation:pf-monochrome-marquee 32s linear infinite}.pf-monochrome-ticker:hover .pf-monochrome-ticker-track{animation-play-state:paused}.pf-monochrome-ticker-group{display:flex;flex-shrink:0;align-items:center;gap:3rem;padding:1.25rem 1.5rem}.pf-monochrome-ticker-group>span{display:flex;align-items:center;gap:3rem;white-space:nowrap;text-transform:uppercase;color:var(--pf-muted);font:500 .875rem/1.6 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em}.pf-monochrome-ticker-group>span>span{color:var(--pf-accent);font-size:1.3rem}
.pf-monochrome-section-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr);align-items:end;gap:3rem;margin-bottom:2.4rem}.pf-monochrome-section-heading .pf-description{margin:0;max-width:50ch}
.pf-monochrome-project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem}.pf-monochrome-project-card{min-width:0;border:1px solid var(--pf-border);border-radius:16px;overflow:hidden;background:var(--pf-surface);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.pf-monochrome-project-card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--pf-text) 50%,transparent);box-shadow:0 18px 50px #0005}.pf-monochrome .pf-art{min-height:250px;background:linear-gradient(140deg,color-mix(in srgb,var(--pf-text) 5%,var(--pf-bg)),var(--pf-bg));padding:2rem}.pf-monochrome .pf-art-typography .pf-art-glyph{font-style:italic;font-size:130px}.pf-monochrome-project-copy{padding:1.8rem}.pf-monochrome .pf-entry h3{font-size:1.5rem}.pf-monochrome .pf-tags li{font-size:.875rem;border-radius:7px;padding:.4rem .7rem}.pf-monochrome-project-card .pf-entry>.pf-meta{display:none}
.pf-monochrome .pf-about{grid-column:1/8;padding-right:1rem}.pf-monochrome .pf-skills{grid-column:8/-1}.pf-monochrome :is(.pf-about,.pf-skills,.pf-experience,.pf-education) .pf-monochrome-section-heading{display:block}.pf-monochrome .pf-about .pf-description{white-space:pre-wrap;margin-top:1.8rem}.pf-monochrome .pf-skills .pf-description{margin-top:1.5rem}.pf-monochrome .pf-skills>.pf-entry{margin-top:2rem}.pf-monochrome .pf-skills>.pf-entry h3{font-size:1.1rem}
.pf-monochrome .pf-experience{grid-column:1/8;padding-right:1rem}.pf-monochrome .pf-education{grid-column:8/-1}.pf-monochrome :is(.pf-experience,.pf-education) .pf-description{margin-top:1.5rem}.pf-monochrome-history{display:grid;gap:1.5rem}.pf-monochrome-history>.pf-entry{padding:1.4rem;border:1px solid var(--pf-border);border-radius:10px;background:color-mix(in srgb,var(--pf-surface) 85%,transparent)}.pf-monochrome-history>.pf-entry h3{font-size:1.1rem}.pf-monochrome-history>.pf-entry .pf-description{font-size:.95rem;margin-top:1rem}.pf-monochrome-history>.pf-entry .pf-meta{color:var(--pf-text)}
.pf-monochrome .pf-contact{padding:clamp(3rem,6cqi,6rem) 0}.pf-monochrome .pf-contact .pf-monochrome-section-heading{margin-bottom:0}.pf-monochrome .pf-contact h2{font-size:clamp(2.5rem,5.5cqi,5rem)}.pf-monochrome-contact-links{display:flex;flex-wrap:wrap;gap:1rem 2rem;margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--pf-border)}.pf-monochrome-contact-links .pf-entry h3{font:500 .875rem/1.7 'Geist Mono',ui-monospace,monospace}.pf-monochrome .pf-footer{max-width:1440px;padding:2rem clamp(1.25rem,4.2cqi,4rem);font-size:.8rem}
@keyframes pf-monochrome-marquee{to{transform:translateX(-50%)}}@keyframes pf-monochrome-blink{50%{opacity:0}}
@container(max-width:920px){.pf-monochrome-hero-grid{grid-template-columns:1fr;gap:2.5rem;padding-bottom:2.5rem}.pf-monochrome-profile{width:min(100%,520px);justify-self:center}.pf-monochrome h1.pf-monochrome-title{font-size:clamp(3rem,9cqi,5.5rem)}.pf-monochrome .pf-section{grid-column:1/-1;padding-right:0}.pf-monochrome-section-heading{gap:1.5rem}.pf-monochrome-main{column-gap:0}.pf-monochrome .pf-about .pf-description{max-width:65ch}.pf-monochrome-profile .pf-monochrome-initials{font-size:clamp(5rem,16cqi,8rem)}}
@container(max-width:700px){.pf-monochrome .pf-monochrome-desktop-nav{display:none}.pf-monochrome-menu{display:block}.pf-monochrome-menu summary{font-size:.875rem;padding:.6rem .8rem;border:1px solid var(--pf-border);border-radius:8px;min-height:44px;list-style:none}.pf-monochrome-menu summary::-webkit-details-marker{display:none}.pf-monochrome-menu[open] .pf-nav{display:flex;position:absolute;left:0;right:0;top:100%;padding:1rem 1.25rem;background:var(--pf-surface);border-bottom:1px solid var(--pf-border);box-shadow:0 20px 30px #0006}.pf-monochrome-brand{font-size:.75rem;gap:.65rem;letter-spacing:.03em}.pf-monochrome-brand-mark{width:36px;height:36px;font-size:1rem}.pf-monochrome-project-grid{grid-template-columns:1fr}.pf-monochrome-section-heading{grid-template-columns:1fr}.pf-monochrome-section-heading .pf-description{margin-top:.5rem}.pf-monochrome .pf-eyebrow{font-size:.75rem}.pf-monochrome .pf-monochrome-title{letter-spacing:-.055em}.pf-monochrome .pf-art{min-height:210px}.pf-monochrome-project-copy{padding:1.3rem}.pf-monochrome .pf-contact .pf-monochrome-section-heading{gap:1.5rem}.pf-monochrome .pf-footer{font-size:.8rem}}
@media(prefers-reduced-motion:reduce){.pf-monochrome *,.pf-monochrome *::before,.pf-monochrome *::after{animation:none!important;transition:none!important}}
`;
