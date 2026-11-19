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
  const reveal = (node: PortfolioElement, delay = 0) => {
    node.attrs['data-monochrome-reveal'] = String(delay);
    return node;
  };
  const intro = (node: PortfolioElement, order: number) => {
    node.attrs['data-monochrome-intro'] = String(order);
    return node;
  };
  const button = (content: PortfolioDocument['sections'][number]['content']) => {
    const node = action(content);
    node?.children.push(el('span', 'pf-monochrome-arrow', ['↗'], { 'aria-hidden': 'true' }));
    return node;
  };
  const heading = (value: string, level: 'h1' | 'h2') => {
    const lines = value.split('\n');
    return el(level, 'pf-monochrome-title', lines.flatMap((line, index) => {
      const last = index === lines.length - 1 ? /^(.*?)(\S+)$/.exec(line) : null;
      return [...(index ? ['\n'] : []), el('span', '', last ? [last[1], el('em', '', [last[2]])] : [line])];
    }));
  };
  const title = (section: PortfolioDocument['sections'][number]) => reveal(el('div', 'pf-monochrome-section-heading', [
    el('div', '', [section.content.subtitle && el('p', 'pf-eyebrow', [section.content.subtitle]), heading(section.content.heading, 'h2')]),
    section.content.description && el('p', 'pf-description', [section.content.description]),
  ]));
  const header = el('header', 'pf-monochrome-header', [
    el('div', 'pf-monochrome-header-inner', [
      el('a', 'pf-monochrome-brand', [el('span', 'pf-monochrome-brand-mark', [initials], { 'aria-hidden': 'true' }), el('span', 'pf-monochrome-brand-name', [name])], { href: '#portfolio-content', 'aria-label': `${name}, home` }),
      el('div', 'pf-monochrome-header-tools', [
        navigation(sections, 'pf-monochrome-desktop-nav'),
        el('button', 'pf-monochrome-motion', ['Pause motion'], { type: 'button', 'data-monochrome-motion': '', 'aria-pressed': 'false' }),
        el('details', 'pf-monochrome-menu', [el('summary', '', ['Menu']), navigation(sections)], { 'data-monochrome-menu': '' }),
      ]),
    ]),
  ]);
  const frame = pageFrame(document, main(sections.map((section) => {
    const c = section.content;
    if (section.type === 'hero') {
      const portraitUrl = c.portraitUrl?.trim();
      const portrait = portraitUrl && isPortfolioImageUrl(portraitUrl)
        ? el('img', '', [], { src: portraitUrl, alt: c.portraitAlt || name, width: '360', height: '360', decoding: 'async', referrerpolicy: 'no-referrer' })
        : el('span', 'pf-monochrome-initials', [initials], { 'aria-hidden': 'true' });
      const ticker = c.tags?.length ? el('div', 'pf-monochrome-ticker', [el('div', 'pf-monochrome-ticker-track', [0, 1].map((copy) =>
        el('div', 'pf-monochrome-ticker-group', c.tags!.map((tag) => el('span', '', [tag, el('span', '', ['◈'], { 'aria-hidden': 'true' })])), copy ? { 'aria-hidden': 'true' } : {})))], { 'aria-label': 'Areas of interest' }) : undefined;
      const meta = metrics(c);
      return sectionShell(section, [
        el('div', 'pf-monochrome-hero-grid', [
          el('div', 'pf-monochrome-hero-copy', [intro(el('p', 'pf-eyebrow pf-monochrome-badge', ['Portfolio / ' + role]), 0), intro(heading(c.heading, 'h1'), 1),
            c.subtitle && intro(el('div', 'pf-monochrome-typebar', [
              el('span', '', ['>'], { 'aria-hidden': 'true' }),
              el('span', 'pf-monochrome-type-content', [
                el('span', 'pf-monochrome-type-size', [c.subtitle], { 'aria-hidden': 'true' }),
                el('span', 'pf-monochrome-type-line', [el('span', '', [c.subtitle], { 'data-monochrome-type': '' }), el('span', 'pf-monochrome-cursor', ['_'])], { 'aria-hidden': 'true' }),
              ]),
              el('span', 'pf-monochrome-sr', [c.subtitle]),
            ]), 2),
            intro(el('p', 'pf-description', [c.description]), 2),
            intro(el('div', 'pf-monochrome-actions', [work && el('a', 'pf-action', ['Explore my work', el('span', 'pf-monochrome-arrow', ['→'], { 'aria-hidden': 'true' })], { href: `#portfolio-${work.id}` }), button(c)]), 3),
            meta && intro(meta, 4),
          ]),
          intro(el('div', 'pf-monochrome-profile-stage', [el('div', 'pf-monochrome-profile-float', [el('aside', 'pf-monochrome-profile', [
            el('p', 'pf-monochrome-profile-code', ['SYS / PROFILE', el('span', '', ['◈'], { 'aria-hidden': 'true' })]),
            el('div', 'pf-monochrome-orbit pf-monochrome-orbit-outer', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-orbit pf-monochrome-orbit-inner', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-aura', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-scanline', [], { 'aria-hidden': 'true' }),
            el('div', 'pf-monochrome-portrait', [portrait]),
            el('div', 'pf-monochrome-profile-caption', [el('span', '', [name, el('strong', '', [role])]), el('span', 'pf-monochrome-symbol', ['◈'], { 'aria-hidden': 'true' })]),
          ], { 'aria-label': `Profile of ${name}`, 'data-monochrome-tilt': '' })])]), 1),
        ]),
        ...(work ? [intro(el('a', 'pf-monochrome-scroll-cue', ['Scroll to explore', el('span', '', ['↓'], { 'aria-hidden': 'true' })], { href: `#portfolio-${work.id}` }), 4)] : []),
        ...(ticker ? [ticker] : []),
      ]);
    }
    if (section.type === 'projects') return sectionShell(section, [title(section),
      el('div', 'pf-monochrome-project-grid', itemsFor(section).map((item, index) => reveal(el('article', 'pf-monochrome-project-card', [
        art(item.visual), el('div', 'pf-monochrome-project-copy', [item.subtitle && el('p', 'pf-eyebrow', [item.subtitle]), entry(item)]),
      ], { 'data-monochrome-tilt': '' }), index % 2 * 120))),
    ]);
    if (section.type === 'about') return sectionShell(section, [title(section), ...(tags(c.tags) ? [reveal(tags(c.tags)!)] : [])]);
    if (section.type === 'skills') return sectionShell(section, [title(section), ...(tags(c.tags) ? [reveal(tags(c.tags)!)] : []), ...itemsFor(section).map((item) => reveal(entry(item)))]);
    if (section.type === 'contact') return sectionShell(section, [title(section), ...(button(c) ? [reveal(button(c)!)] : []),
      reveal(el('div', 'pf-monochrome-contact-links', (c.items ?? []).map((item) => entry(item)))),
    ]);
    return sectionShell(section, [title(section), el('div', 'pf-monochrome-history', itemsFor(section).map((item, index) => reveal(entry(item), index % 3 * 100))), ...(tags(c.tags) ? [reveal(tags(c.tags)!)] : [])]);
  }), 'pf-monochrome-main'), '', header);
  frame.attrs['data-monochrome-page'] = '';
  frame.children.unshift(el('div', 'pf-monochrome-background', [el('div', 'pf-monochrome-background-stage', [
    el('canvas', 'pf-monochrome-particles', [], { 'data-monochrome-particles': '' }),
    el('div', 'pf-monochrome-spotlight', []),
  ], { 'data-monochrome-background': '' })], { 'aria-hidden': 'true' }));
  return frame;
}

export const MONOCHROME_CSS = `
.pf-monochrome{position:relative;background-color:var(--pf-bg);background-image:radial-gradient(ellipse at 12% 5%,color-mix(in srgb,var(--pf-accent) 7%,transparent),transparent 42%),linear-gradient(color-mix(in srgb,var(--pf-text) 3%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pf-text) 3%,transparent) 1px,transparent 1px);background-size:auto,48px 48px,48px 48px}
.pf-monochrome .pf-description{font-size:1rem;line-height:1.85}.pf-monochrome .pf-eyebrow{font:500 .8rem/1.8 'Geist Mono',ui-monospace,monospace;letter-spacing:.1em;margin-bottom:1rem}.pf-monochrome .pf-meta{font-size:.875rem}
.pf-monochrome-header{position:sticky;top:0;z-index:5;border-bottom:1px solid var(--pf-border);background:color-mix(in srgb,var(--pf-bg) 88%,transparent);backdrop-filter:blur(16px)}
.pf-monochrome-header-inner{max-width:1440px;margin:auto;min-height:86px;padding:1rem clamp(1.25rem,4.2cqi,4rem);display:flex;align-items:center;justify-content:space-between;gap:1.5rem}
.pf-monochrome-brand{display:flex;align-items:center;gap:.9rem;min-width:0;font:600 .875rem/1.5 'Geist Mono',ui-monospace,monospace;letter-spacing:.07em;text-transform:uppercase}
.pf-monochrome-brand-mark{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;border-radius:10px;background:var(--pf-accent);color:var(--pf-on-accent);font:700 1.15rem/1 var(--pf-heading-font);letter-spacing:-.06em;box-shadow:0 0 24px color-mix(in srgb,var(--pf-accent) 20%,transparent)}
.pf-monochrome .pf-nav{font-size:.875rem;gap:.2rem 1.2rem;color:var(--pf-muted)}.pf-monochrome .pf-nav a:last-child{border:1px solid var(--pf-border);border-radius:8px;padding:0 1rem;color:var(--pf-text)}.pf-monochrome-menu{display:none}
.pf-monochrome-main{position:relative;z-index:1;max-width:1440px;padding:0 clamp(1.25rem,4.2cqi,4rem);display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:3rem}
.pf-monochrome .pf-section{grid-column:1/-1;padding:var(--pf-space) 0;scroll-margin-top:7rem;border-bottom:1px solid var(--pf-border)}
.pf-monochrome .pf-hero{padding-top:clamp(2rem,6cqi,5.5rem);padding-bottom:0}.pf-monochrome-hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:center;gap:6%;padding-bottom:4rem;min-height:600px}
.pf-monochrome-background{position:sticky;top:0;height:0;z-index:0;pointer-events:none}.pf-monochrome-background-stage{position:relative;height:var(--pf-monochrome-viewport,100vh);max-height:1200px;overflow:hidden}.pf-monochrome-particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;max-width:100%}.pf-monochrome-spotlight{position:absolute;top:-220px;left:-220px;width:440px;height:440px;border-radius:50%;opacity:0;background:radial-gradient(circle,color-mix(in srgb,var(--pf-text) 9%,transparent),color-mix(in srgb,var(--pf-text) 3%,transparent) 40%,transparent 70%);transform:translate3d(var(--pf-pointer-x,0px),var(--pf-pointer-y,0px),0);transition:opacity .2s,transform .06s linear}.pf-monochrome[data-monochrome-pointer] .pf-monochrome-spotlight{opacity:1}
.pf-monochrome-hero-copy{min-width:0;position:relative}.pf-monochrome .pf-monochrome-badge{display:inline-flex;align-items:center;gap:.65rem;max-width:100%;border:1px solid var(--pf-border);background:color-mix(in srgb,var(--pf-text) 5%,transparent);border-radius:99px;padding:.4rem .9rem;font-size:.75rem}.pf-monochrome-badge::before{content:'';flex-shrink:0;width:7px;height:7px;background:var(--pf-accent);border-radius:50%;box-shadow:0 0 8px var(--pf-accent);animation:pf-monochrome-pulse 2s ease-in-out infinite;animation-play-state:paused}
.pf-monochrome .pf-monochrome-title{max-width:none;white-space:normal;letter-spacing:-.065em;line-height:1.08}.pf-monochrome-title>span{display:block}.pf-monochrome .pf-monochrome-title em{font-weight:600;font-style:normal;background:linear-gradient(110deg,var(--pf-text),var(--pf-muted) 35%,var(--pf-text) 55%,var(--pf-muted) 80%,var(--pf-text));background-size:240% auto;background-clip:text;-webkit-background-clip:text;color:transparent;animation:pf-monochrome-gradient 4.5s linear infinite;animation-play-state:paused}
.pf-monochrome h1.pf-monochrome-title{font-size:clamp(2.7rem,6.6cqi,6.2rem)}.pf-monochrome h2.pf-monochrome-title{font-size:clamp(2rem,3.6cqi,3.5rem)}
.pf-monochrome-typebar{position:relative;font:400 .875rem/1.9 'Geist Mono',ui-monospace,monospace;display:flex;align-items:flex-start;gap:.65rem;color:var(--pf-text);margin-top:1.7rem!important;min-height:3rem;padding:.5rem 1rem;border-left:2px solid var(--pf-accent);border-radius:0 8px 8px 0;background:color-mix(in srgb,var(--pf-text) 5%,transparent)}.pf-monochrome-typebar>span:first-child{color:var(--pf-muted)}.pf-monochrome-type-content{display:grid;min-width:0;flex:1}.pf-monochrome-type-content>span{grid-area:1/1;white-space:pre-wrap}.pf-monochrome-type-size{visibility:hidden}.pf-monochrome-cursor{margin-left:.25rem;animation:pf-monochrome-blink .8s steps(2,start) infinite;animation-play-state:paused}.pf-monochrome-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.pf-monochrome .pf-hero .pf-description{max-width:53ch;margin-top:1rem}.pf-monochrome-actions{display:flex;align-items:center;flex-wrap:wrap;gap:1.5rem;margin-top:.5rem}.pf-monochrome .pf-action{font-size:.875rem;min-height:48px;border-radius:9px;padding:.8rem 1.3rem;border:1px solid var(--pf-accent);box-shadow:0 4px 24px color-mix(in srgb,var(--pf-accent) 12%,transparent)}.pf-monochrome-actions .pf-action+ .pf-action{color:var(--pf-text)!important;background:transparent;border-color:transparent;box-shadow:none;padding:.8rem 0}
.pf-monochrome .pf-metrics{border-top:1px solid var(--pf-border);padding-top:1.5rem;gap:1rem;margin-top:2rem!important}.pf-monochrome .pf-metrics dt{font-size:.8rem}.pf-monochrome .pf-metrics dd{font-size:1.1rem;font-weight:500}
.pf-monochrome-profile-stage{min-width:0}.pf-monochrome-profile-float{animation:pf-monochrome-float 5.5s ease-in-out 1.2s infinite;animation-play-state:paused}.pf-monochrome-profile{position:relative;min-width:0;aspect-ratio:1/1.08;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid color-mix(in srgb,var(--pf-text) 22%,transparent);border-radius:22px;background:radial-gradient(circle at var(--pf-light-x,50%) var(--pf-light-y,35%),color-mix(in srgb,var(--pf-text) 18%,transparent),transparent 60%),linear-gradient(140deg,color-mix(in srgb,var(--pf-text) 8%,var(--pf-surface)),var(--pf-surface) 65%);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--pf-text) 10%,transparent),0 24px 65px #0004;transform:perspective(1000px) rotateX(var(--pf-tilt-x,0deg)) rotateY(var(--pf-tilt-y,0deg));transition:transform .18s ease-out,border-color .28s ease,box-shadow .28s ease}
.pf-monochrome-profile::before{content:'';position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--pf-text) 5%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pf-text) 5%,transparent) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(#000,transparent)}
.pf-monochrome-profile-code,.pf-monochrome-profile-caption{position:absolute;left:1.6rem;right:1.6rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;z-index:2;font:400 .75rem/1.8 'Geist Mono',ui-monospace,monospace;color:var(--pf-muted);letter-spacing:.08em}.pf-monochrome-profile-code{top:1.5rem}.pf-monochrome-profile-code>span{color:var(--pf-text);font-size:1.5rem}.pf-monochrome-profile-caption{bottom:1.5rem}.pf-monochrome-profile-caption strong{display:block;font-size:.8rem;letter-spacing:.02em;font-weight:500;color:var(--pf-text)}.pf-monochrome-profile-caption .pf-monochrome-symbol{font-size:2.5rem;color:var(--pf-accent)}
.pf-monochrome-portrait{position:relative;z-index:1;width:68%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pf-text) 25%,transparent);border-radius:50%;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 35% 20%,color-mix(in srgb,var(--pf-text) 20%,var(--pf-surface)),var(--pf-bg));box-shadow:0 0 70px color-mix(in srgb,var(--pf-text) 8%,transparent)}.pf-monochrome-portrait img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(1)}.pf-monochrome-initials{font:500 clamp(3rem,10cqi,8rem)/1 var(--pf-heading-font);letter-spacing:-.08em;color:var(--pf-text)}
.pf-monochrome-orbit{position:absolute;width:88%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pf-text) 10%,transparent);border-top-color:color-mix(in srgb,var(--pf-text) 35%,transparent);border-radius:50%;animation:pf-monochrome-spin 16s linear infinite reverse;animation-play-state:paused}.pf-monochrome-orbit-inner{width:78%;border-style:dashed;animation-duration:22s;animation-direction:normal}.pf-monochrome-aura{position:absolute;left:25%;top:12%;width:50%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--pf-text) 25%,transparent),transparent 72%);filter:blur(24px);animation:pf-monochrome-breathe 4s ease-in-out infinite alternate;animation-play-state:paused}.pf-monochrome-scanline{position:absolute;left:0;right:0;top:6%;height:1.5px;z-index:3;opacity:0;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--pf-text) 65%,transparent),transparent);box-shadow:0 0 16px color-mix(in srgb,var(--pf-text) 70%,transparent);animation:pf-monochrome-scan 4.2s ease-in-out infinite;animation-play-state:paused}
.pf-monochrome-ticker{position:relative;overflow:hidden;border-top:1px solid var(--pf-border);border-bottom:1px solid var(--pf-border);margin:1rem 0 0;background:color-mix(in srgb,var(--pf-surface) 75%,transparent)}.pf-monochrome-ticker-track{display:flex;width:max-content;animation:pf-monochrome-marquee 22s linear infinite;animation-play-state:paused}.pf-monochrome-ticker-group{display:flex;flex-shrink:0;align-items:center;gap:3rem;padding:1.25rem 1.5rem}.pf-monochrome-ticker-group>span{display:flex;align-items:center;gap:3rem;white-space:nowrap;text-transform:uppercase;color:var(--pf-muted);font:500 .875rem/1.6 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em}.pf-monochrome-ticker-group>span>span{color:var(--pf-accent);font-size:1.3rem}
.pf-monochrome-section-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr);align-items:end;gap:3rem;margin-bottom:2.4rem}.pf-monochrome-section-heading .pf-description{margin:0;max-width:50ch}
.pf-monochrome-project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem}.pf-monochrome-project-card{min-width:0;border:1px solid var(--pf-border);border-radius:16px;overflow:hidden;background:radial-gradient(circle at var(--pf-light-x,50%) var(--pf-light-y,35%),color-mix(in srgb,var(--pf-text) 7%,transparent),transparent 65%),var(--pf-surface);transform:perspective(1000px) rotateX(var(--pf-tilt-x,0deg)) rotateY(var(--pf-tilt-y,0deg));transition:transform .18s ease-out,border-color .28s ease,box-shadow .28s ease}.pf-monochrome-project-card:hover{border-color:color-mix(in srgb,var(--pf-text) 50%,transparent);box-shadow:0 18px 50px #0005}.pf-monochrome .pf-art{min-height:250px;background:linear-gradient(140deg,color-mix(in srgb,var(--pf-text) 5%,var(--pf-bg)),var(--pf-bg));padding:2rem}.pf-monochrome .pf-art-typography .pf-art-glyph{font-style:italic;font-size:130px}.pf-monochrome-project-copy{padding:1.8rem}.pf-monochrome .pf-entry h3{font-size:1.5rem}.pf-monochrome .pf-tags li{font-size:.875rem;border-radius:7px;padding:.4rem .7rem}.pf-monochrome-project-card .pf-entry>.pf-meta{display:none}
.pf-monochrome .pf-about{grid-column:1/8;padding-right:1rem}.pf-monochrome .pf-skills{grid-column:8/-1}.pf-monochrome :is(.pf-about,.pf-skills,.pf-experience,.pf-education) .pf-monochrome-section-heading{display:block}.pf-monochrome .pf-about .pf-description{white-space:pre-wrap;margin-top:1.8rem}.pf-monochrome .pf-skills .pf-description{margin-top:1.5rem}.pf-monochrome .pf-skills>.pf-entry{margin-top:2rem}.pf-monochrome .pf-skills>.pf-entry h3{font-size:1.1rem}
.pf-monochrome .pf-experience{grid-column:1/8;padding-right:1rem}.pf-monochrome .pf-education{grid-column:8/-1}.pf-monochrome :is(.pf-experience,.pf-education) .pf-description{margin-top:1.5rem}.pf-monochrome-history{display:grid;gap:1.5rem}.pf-monochrome-history>.pf-entry{padding:1.4rem;border:1px solid var(--pf-border);border-radius:10px;background:color-mix(in srgb,var(--pf-surface) 85%,transparent)}.pf-monochrome-history>.pf-entry h3{font-size:1.1rem}.pf-monochrome-history>.pf-entry .pf-description{font-size:.95rem;margin-top:1rem}.pf-monochrome-history>.pf-entry .pf-meta{color:var(--pf-text)}
.pf-monochrome .pf-contact{padding:clamp(3rem,6cqi,6rem) 0}.pf-monochrome .pf-contact .pf-monochrome-section-heading{margin-bottom:0}.pf-monochrome .pf-contact h2{font-size:clamp(2.5rem,5.5cqi,5rem)}.pf-monochrome-contact-links{display:flex;flex-wrap:wrap;gap:1rem 2rem;margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--pf-border)}.pf-monochrome-contact-links .pf-entry h3{font:500 .875rem/1.7 'Geist Mono',ui-monospace,monospace}.pf-monochrome .pf-footer{max-width:1440px;padding:2rem clamp(1.25rem,4.2cqi,4rem);font-size:.8rem}
.pf-monochrome-header-tools{display:flex;align-items:center;gap:1rem}.pf-monochrome-motion{display:none;align-items:center;justify-content:center;flex-shrink:0;min-height:44px;padding:.5rem .75rem;border:1px solid var(--pf-border);border-radius:8px;background:var(--pf-surface);color:var(--pf-text);font-size:.875rem;white-space:nowrap}.pf-monochrome[data-monochrome-enhanced] .pf-monochrome-motion{display:inline-flex}.pf-monochrome-motion:hover{border-color:var(--pf-accent)}.pf-monochrome-motion[aria-disabled=true]{color:var(--pf-muted);cursor:default}
.pf-monochrome-brand-mark{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}.pf-monochrome-brand:hover .pf-monochrome-brand-mark{transform:scale(1.1) rotate(-6deg)}.pf-monochrome .pf-nav a{position:relative;transition:color .22s,border-color .22s,box-shadow .22s}.pf-monochrome .pf-nav a:not(:last-child)::after{content:'';position:absolute;bottom:.3rem;left:0;width:100%;height:1px;background:var(--pf-accent);transform:scaleX(0);transform-origin:right;transition:transform .3s cubic-bezier(.22,1,.36,1)}.pf-monochrome .pf-nav a:is(:hover,:focus-visible)::after{transform:scaleX(1);transform-origin:left}
.pf-monochrome .pf-action{position:relative;overflow:hidden;gap:1rem;transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s}.pf-monochrome .pf-action::before{content:'';position:absolute;top:0;left:-150%;width:55%;height:100%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--pf-on-accent) 12%,transparent),transparent);transform:skewX(-20deg);transition:left .55s ease}.pf-monochrome .pf-action:hover::before{left:150%}.pf-monochrome-arrow{display:inline-block;transition:transform .25s cubic-bezier(.22,1,.36,1)}.pf-monochrome .pf-action:hover .pf-monochrome-arrow{transform:translate(4px,-4px)}.pf-monochrome-actions .pf-action:first-child:hover .pf-monochrome-arrow{transform:translateX(5px)}
.pf-monochrome-scroll-cue{display:inline-flex;align-items:center;gap:1rem;min-height:44px;margin-bottom:1rem;color:var(--pf-muted)!important;font:500 .75rem/1.6 'Geist Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase}.pf-monochrome-scroll-cue>span{font-size:1.25rem;color:var(--pf-text);animation:pf-monochrome-bounce 1.6s ease-in-out infinite;animation-play-state:paused}.pf-monochrome .pf-footer{position:relative;z-index:1}
.pf-monochrome-profile-code>span,.pf-monochrome-symbol,.pf-monochrome-ticker-group>span>span{display:inline-block;animation:pf-monochrome-symbol 4s ease-in-out infinite;animation-play-state:paused}.pf-monochrome-symbol{animation-direction:reverse}
.pf-monochrome[data-monochrome-enhanced]:not([data-monochrome-reduced]):not([data-monochrome-paused]) [data-monochrome-intro]{animation:pf-monochrome-enter .9s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(80ms + var(--pf-intro-index,0) * 100ms)}
.pf-monochrome[data-monochrome-enhanced] [data-monochrome-reveal]{transition:opacity .75s cubic-bezier(.16,1,.3,1) var(--pf-reveal-delay,0ms),translate .75s cubic-bezier(.16,1,.3,1) var(--pf-reveal-delay,0ms),scale .75s cubic-bezier(.16,1,.3,1) var(--pf-reveal-delay,0ms),filter .75s cubic-bezier(.16,1,.3,1) var(--pf-reveal-delay,0ms)}
.pf-monochrome[data-monochrome-enhanced] .pf-monochrome-project-card{transition:opacity .75s ease var(--pf-reveal-delay,0ms),translate .75s cubic-bezier(.16,1,.3,1) var(--pf-reveal-delay,0ms),scale .75s ease var(--pf-reveal-delay,0ms),filter .75s ease var(--pf-reveal-delay,0ms),transform .18s ease-out,border-color .28s ease,box-shadow .28s ease}
.pf-monochrome[data-monochrome-enhanced]:not([data-monochrome-reduced]):not([data-monochrome-paused]) [data-monochrome-reveal]:not([data-monochrome-in-view]):not(:focus-within){opacity:0;translate:0 38px;scale:.98;filter:blur(4px)}
.pf-monochrome .pf-skills>.pf-tags li{transition:opacity .55s ease var(--pf-chip-delay,0ms),translate .55s cubic-bezier(.16,1,.3,1) var(--pf-chip-delay,0ms),scale .55s ease var(--pf-chip-delay,0ms),color .2s,border-color .2s,background .2s,box-shadow .2s}.pf-monochrome[data-monochrome-enhanced]:not([data-monochrome-reduced]):not([data-monochrome-paused]) .pf-skills>.pf-tags:not([data-monochrome-in-view]):not(:focus-within) li{opacity:0;translate:0 18px;scale:.92}
.pf-monochrome[data-monochrome-running] .pf-monochrome-title[data-monochrome-active] em,.pf-monochrome[data-monochrome-running] .pf-monochrome-badge[data-monochrome-active]::before,.pf-monochrome[data-monochrome-running] .pf-monochrome-typebar[data-monochrome-active] .pf-monochrome-cursor,.pf-monochrome[data-monochrome-running] .pf-monochrome-profile-float[data-monochrome-active],.pf-monochrome[data-monochrome-running] .pf-monochrome-profile-float[data-monochrome-active] :is(.pf-monochrome-orbit,.pf-monochrome-aura,.pf-monochrome-scanline,.pf-monochrome-profile-code>span,.pf-monochrome-symbol),.pf-monochrome[data-monochrome-running] .pf-monochrome-ticker[data-monochrome-active] :is(.pf-monochrome-ticker-track,.pf-monochrome-ticker-group>span>span),.pf-monochrome[data-monochrome-running] .pf-monochrome-scroll-cue[data-monochrome-active]>span{animation-play-state:running}
.pf-monochrome[data-monochrome-running] .pf-monochrome-ticker:hover :is(.pf-monochrome-ticker-track,.pf-monochrome-ticker-group>span>span){animation-play-state:paused}
@media(hover:hover) and (pointer:fine){.pf-monochrome[data-monochrome-running] .pf-action:hover{transform:translateY(-3px) scale(1.02)}.pf-monochrome[data-monochrome-running] .pf-monochrome-portrait img{transition:transform .45s cubic-bezier(.22,1,.36,1),filter .45s}.pf-monochrome[data-monochrome-running] .pf-monochrome-profile:hover .pf-monochrome-portrait img{transform:scale(1.05) translateY(-4px);filter:grayscale(0)}.pf-monochrome .pf-art>span{transition:scale .45s cubic-bezier(.16,1,.3,1),rotate .45s}.pf-monochrome[data-monochrome-running] .pf-monochrome-project-card:hover .pf-art>span{scale:1.08;rotate:-1deg}.pf-monochrome[data-monochrome-running] .pf-skills>.pf-tags li:hover{translate:0 -4px;scale:1.05;background:var(--pf-accent);color:var(--pf-on-accent);border-color:var(--pf-accent);box-shadow:0 10px 26px color-mix(in srgb,var(--pf-accent) 32%,transparent)}.pf-monochrome-history .pf-entry{transition:transform .25s,border-color .25s}.pf-monochrome[data-monochrome-running] .pf-monochrome-history .pf-entry:hover{transform:translateX(6px);border-color:var(--pf-muted)}}
.pf-monochrome[data-monochrome-paused] *,.pf-monochrome[data-monochrome-paused] *::before,.pf-monochrome[data-monochrome-paused] *::after{animation-play-state:paused!important;transition:none!important}.pf-monochrome[data-monochrome-paused] [data-monochrome-intro]{animation:none!important}.pf-monochrome[data-monochrome-reduced] *,.pf-monochrome[data-monochrome-reduced] *::before,.pf-monochrome[data-monochrome-reduced] *::after{animation:none!important;transition:none!important}.pf-monochrome:is([data-monochrome-reduced],[data-monochrome-paused]) :is([data-monochrome-tilt],.pf-monochrome-brand-mark,.pf-action,.pf-monochrome-arrow,.pf-monochrome-portrait img,.pf-monochrome-history .pf-entry){transform:none!important}
@keyframes pf-monochrome-marquee{to{transform:translateX(-50%)}}@keyframes pf-monochrome-blink{50%{opacity:0}}@keyframes pf-monochrome-spin{to{transform:rotate(360deg)}}@keyframes pf-monochrome-gradient{to{background-position:240% 50%}}@keyframes pf-monochrome-float{50%{translate:0 -12px}}@keyframes pf-monochrome-breathe{from{scale:.88;opacity:.45}to{scale:1.2;opacity:1}}@keyframes pf-monochrome-scan{0%{top:6%;opacity:0}15%,85%{opacity:.85}100%{top:94%;opacity:0}}@keyframes pf-monochrome-symbol{50%{transform:rotate(90deg) scale(1.18)}}@keyframes pf-monochrome-bounce{50%{transform:translateY(7px)}}@keyframes pf-monochrome-pulse{50%{transform:scale(1.2);box-shadow:0 0 16px var(--pf-accent),0 0 0 7px transparent}}@keyframes pf-monochrome-enter{from{opacity:0;transform:translateY(34px) scale(.98);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}}
@container(max-width:1000px){.pf-monochrome .pf-monochrome-desktop-nav{display:none}.pf-monochrome-menu{display:block}.pf-monochrome-menu summary{font-size:.875rem;padding:.6rem .8rem;border:1px solid var(--pf-border);border-radius:8px;min-height:44px;list-style:none}.pf-monochrome-menu summary::-webkit-details-marker{display:none}.pf-monochrome-menu[open] .pf-nav{display:flex;position:absolute;left:0;right:0;top:100%;padding:1rem 1.25rem;background:var(--pf-surface);border-bottom:1px solid var(--pf-border);box-shadow:0 20px 30px #0006}}
@container(max-width:920px){.pf-monochrome-hero-grid{grid-template-columns:1fr;gap:2.5rem;padding-bottom:2.5rem}.pf-monochrome-profile-stage{width:min(100%,520px);justify-self:center}.pf-monochrome h1.pf-monochrome-title{font-size:clamp(3rem,9cqi,5.5rem)}.pf-monochrome .pf-section{grid-column:1/-1;padding-right:0}.pf-monochrome-section-heading{gap:1.5rem}.pf-monochrome-main{column-gap:0}.pf-monochrome .pf-about .pf-description{max-width:65ch}.pf-monochrome-profile .pf-monochrome-initials{font-size:clamp(5rem,16cqi,8rem)}}
@container(max-width:700px){.pf-monochrome .pf-monochrome-desktop-nav{display:none}.pf-monochrome-menu{display:block}.pf-monochrome-menu summary{font-size:.875rem;padding:.6rem .8rem;border:1px solid var(--pf-border);border-radius:8px;min-height:44px;list-style:none}.pf-monochrome-menu summary::-webkit-details-marker{display:none}.pf-monochrome-menu[open] .pf-nav{display:flex;position:absolute;left:0;right:0;top:100%;padding:1rem 1.25rem;background:var(--pf-surface);border-bottom:1px solid var(--pf-border);box-shadow:0 20px 30px #0006}.pf-monochrome-brand{font-size:.75rem;gap:.65rem;letter-spacing:.03em}.pf-monochrome-brand-mark{width:36px;height:36px;font-size:1rem}.pf-monochrome-project-grid{grid-template-columns:1fr}.pf-monochrome-section-heading{grid-template-columns:1fr}.pf-monochrome-section-heading .pf-description{margin-top:.5rem}.pf-monochrome .pf-eyebrow{font-size:.75rem}.pf-monochrome .pf-monochrome-title{letter-spacing:-.055em}.pf-monochrome .pf-art{min-height:210px}.pf-monochrome-project-copy{padding:1.3rem}.pf-monochrome .pf-contact .pf-monochrome-section-heading{gap:1.5rem}.pf-monochrome .pf-footer{font-size:.8rem}}
@container(max-width:500px){.pf-monochrome-brand-name{display:none}.pf-monochrome-header-tools{gap:.5rem}.pf-monochrome-header-inner{gap:.5rem}.pf-monochrome-motion{font-size:.8rem}.pf-monochrome-profile-caption{left:1rem;right:1rem}}
@media(prefers-reduced-motion:reduce){.pf-monochrome *,.pf-monochrome *::before,.pf-monochrome *::after{animation:none!important;transition:none!important}.pf-monochrome [data-monochrome-reveal],.pf-monochrome .pf-skills>.pf-tags li{opacity:1!important;translate:none!important;scale:none!important;filter:none!important}.pf-monochrome :is([data-monochrome-tilt],.pf-monochrome-brand-mark,.pf-action,.pf-monochrome-arrow,.pf-monochrome-portrait img,.pf-monochrome-history .pf-entry){transform:none!important}}
`;
