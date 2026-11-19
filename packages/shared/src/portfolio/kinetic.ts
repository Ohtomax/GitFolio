import { TemplateSchema } from '../validation/template.schema.js';
import { isPortfolioImageUrl } from '../validation/section-content.schema.js';
import { el, main, pageFrame, sectionShell, sectionNames, entry, itemsFor, art, action, metrics, tags, navigation, link,
  type PortfolioDocument, type PortfolioElement } from './tree.js';

export const kineticTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000d',
  name: 'Kinetic / Animated Portfolio', category: 'premium', isReact: false, thumbnailUrl: null,
  description: 'An expressive designer-developer portfolio with oversized type, immersive project scenes, scroll reveals, a moving toolkit, and gentle pointer-driven depth. Includes motion controls and original fictional content.',
  defaultConfig: {
    theme: { layout: 'kinetic', demo: true, font: 'sans', headingFont: 'sans', spacing: 'spacious',
      colors: { background: '#fafafa', surface: '#f0f0f4', text: '#17171c', muted: '#60606b', accent: '#4938dc', border: '#ceced8' } },
    sections: [
      { type: 'hero', visible: true, content: {
        eyebrow: 'Riley Vale / Designer & creative developer', heading: 'A little curiosity.\nA lot of possibility.',
        subtitle: 'Independent design & creative development',
        description: 'I shape useful ideas into expressive digital experiences. From the first question to the last interaction, I connect thoughtful design with the craft of building for the web.',
        buttonLabel: 'Let’s make something', buttonUrl: 'mailto:riley@example.com', portraitUrl: '', portraitAlt: 'Riley Vale',
        tags: ['Considered interfaces', 'Playful details', 'Useful products', 'Design through code'],
        metrics: [{ value: 'Design + code', label: 'My practice' }, { value: 'Independent', label: 'How I work' }, { value: 'Collaborative', label: 'By nature' }],
      } },
      { type: 'projects', visible: true, content: {
        heading: 'Ideas, made tangible.', subtitle: 'Selected work',
        description: 'A few fictional concept projects, each exploring a different way to make the everyday feel more considered.',
        items: [
          { title: 'Luma', subtitle: 'A calmer place to read', visual: 'dashboard',
            description: 'A reading workspace that helps curious people collect, connect, and return to the things that matter. I explored the product direction, shaped the design system, and built an accessible interface prototype.',
            url: 'https://example.com/riley/luma', tags: ['Product design', 'Design systems', 'React'] },
          { title: 'Formspace', subtitle: 'Room for the next idea', visual: 'typography',
            description: 'A visual identity and flexible web experience for an imagined creative workshop. Expressive typography meets a clear structure that gives every project room to tell its own story.',
            url: 'https://example.com/riley/formspace', tags: ['Art direction', 'Brand identity', 'Web development'] },
          { title: 'Daylight', subtitle: 'Small plans. Better days.', visual: 'mobile',
            description: 'A lightweight planning concept built around focus and breathing room. I worked through the interaction model, tested responsive layouts, and translated the design into reusable components.',
            url: 'https://example.com/riley/daylight', tags: ['Interaction design', 'Prototyping', 'TypeScript'] },
        ],
      } },
      { type: 'about', visible: true, content: {
        heading: 'Good work starts\nwith good questions.', subtitle: 'A bit about me',
        description: 'I’m Riley, a designer who likes to build and a developer who cares about the details. My favorite projects begin with a real question and leave room for a surprising answer.\n\nI work across strategy, visual systems, and frontend development. The thread through all of it is simple: understand the people, make the important things clear, and leave the experience better than I found it.',
        tags: ['Curious by default', 'Open to collaboration', 'Always learning'],
      } },
      { type: 'skills', visible: true, content: {
        heading: 'From a rough idea\nto a thoughtful experience.', subtitle: 'What I bring',
        description: 'A flexible toolkit, grounded in clear thinking, careful execution, and a willingness to try something different.',
        tags: ['Product strategy', 'UI & interaction', 'Design systems', 'Prototyping', 'Figma', 'React', 'TypeScript', 'CSS', 'Accessibility'],
        items: [
          { title: 'Find the shape', description: 'Ask useful questions, map the problem, and turn a loose idea into a clear direction.' },
          { title: 'Make it feel right', description: 'Build visual and interaction systems that balance expression, clarity, and accessibility.' },
          { title: 'Bring it to life', description: 'Translate the design into responsive components, purposeful motion, and a dependable web experience.' },
        ],
      } },
      { type: 'experience', visible: true, content: {
        heading: 'A practice built\nby making.', subtitle: 'Experience',
        description: 'Illustrative roles and organizations. Replace these examples with your own story.',
        items: [
          { title: 'Independent Designer & Developer', subtitle: '2024 — Present · Fictional example', description: 'Partner with small teams to shape product concepts, create visual systems, and build thoughtful interfaces from first sketch to working prototype.' },
          { title: 'Product Designer · Foldline Studio', subtitle: '2021 — 2024 · Fictional example', description: 'Worked across research, interface design, and frontend delivery for an imagined multidisciplinary design studio.' },
        ],
      } },
      { type: 'writing', visible: true, content: {
        heading: 'A few things\nI’m thinking about.', subtitle: 'Notes & experiments',
        description: 'Fictional article placeholders for ideas that connect design, code, and the everyday.',
        items: [
          { title: 'When a small interaction makes a big difference', subtitle: 'Design notes · 2025', description: 'A practical look at feedback, rhythm, and the details that help an interface feel understood.', url: 'https://example.com/riley/notes/small-interactions' },
          { title: 'Making room for the first rough version', subtitle: 'Process notes · 2025', description: 'Why a small, working prototype can ask better questions than a polished presentation.', url: 'https://example.com/riley/notes/rough-versions' },
        ],
      } },
      { type: 'contact', visible: true, content: {
        heading: 'Something in mind?\nLet’s give it shape.', subtitle: 'Next, together',
        description: 'A new product, a fresh perspective, or a detail worth getting right. Tell me what you’re thinking and let’s see where it could go.',
        buttonLabel: 'Say hello', buttonUrl: 'mailto:riley@example.com',
        items: [{ title: 'Email', url: 'mailto:riley@example.com' }, { title: 'Selected experiments', url: 'https://example.com/riley/experiments' }, { title: 'Professional profile', url: 'https://example.com/riley/profile' }],
      } },
    ],
  },
});

export function renderKinetic(document: PortfolioDocument): PortfolioElement {
  const sections = document.sections.filter((section) => section.visible);
  const hero = sections.find((section) => section.type === 'hero');
  const name = hero?.content.eyebrow?.split('/')[0].trim() || 'Your name';
  const role = hero?.content.eyebrow?.split('/').slice(1).join('/').trim() || 'Independent creative';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const work = sections.find((section) => section.type === 'projects');
  const header = el('header', 'pf-kinetic-header', [
    el('a', 'pf-kinetic-brand', [el('span', 'pf-kinetic-mark', ['✳'], { 'aria-hidden': 'true' }), name], { href: '#portfolio-content' }),
    el('div', 'pf-kinetic-header-tools', [
      navigation(sections, 'pf-kinetic-desktop-nav'),
      el('button', 'pf-kinetic-motion', ['Pause motion'], { type: 'button', 'data-kinetic-motion': '', 'aria-pressed': 'false' }),
      el('details', 'pf-kinetic-menu', [el('summary', '', ['Menu']), navigation(sections)], { 'data-kinetic-menu': '' }),
    ]),
  ]);
  const title = (section: PortfolioDocument['sections'][number]) => el('div', 'pf-kinetic-section-heading', [
    section.content.subtitle && el('p', 'pf-eyebrow', [section.content.subtitle]),
    el('h2', '', [section.content.heading || sectionNames[section.type]]),
  ], { 'data-kinetic-reveal': '' });
  const body = main(sections.map((section) => {
    const c = section.content;
    if (section.type === 'hero') {
      const portrait = c.portraitUrl?.trim();
      return sectionShell(section, [
        el('div', 'pf-kinetic-hero-top', [
          el('p', 'pf-kinetic-intro', [role]),
        ]),
        el('div', 'pf-kinetic-hero-grid', [
          el('div', 'pf-kinetic-hero-copy', [
            el('h1', 'pf-kinetic-title', c.heading.split(/(\s+)/).map((word) => /\s/.test(word) || !word ? word : el('span', 'pf-kinetic-word', [word], { 'data-kinetic-word': '' }))),
            el('div', 'pf-kinetic-identity', [
              el('div', 'pf-kinetic-avatar', [portrait && isPortfolioImageUrl(portrait)
                ? el('img', '', [], { src: portrait, alt: c.portraitAlt || name, width: '64', height: '64', decoding: 'async', referrerpolicy: 'no-referrer' })
                : el('span', '', [initials], { 'aria-hidden': 'true' })]),
              el('p', '', [el('strong', '', [name]), c.subtitle && el('span', '', [c.subtitle])]),
            ]),
          ]),
          el('div', 'pf-kinetic-hero-scene', [
            el('div', 'pf-kinetic-sculpture', [
              el('div', 'pf-kinetic-orbit', []), el('div', 'pf-kinetic-orbit pf-kinetic-orbit-back', []),
              el('div', 'pf-kinetic-sphere', []), el('div', 'pf-kinetic-pebble', []),
              el('div', 'pf-kinetic-scene-label', ['A little space for possibility.']),
            ], { 'data-kinetic-tilt': '' }),
          ], { 'aria-hidden': 'true', 'data-kinetic-animate': '' }),
        ], { 'data-kinetic-scroll': '' }),
        el('div', 'pf-kinetic-hero-bottom', [el('p', 'pf-description', [c.description]),
          el('div', 'pf-kinetic-actions', [work && el('a', 'pf-action', ['Explore the work'], { href: `#portfolio-${work.id}` }), action(c)])]),
        ...(metrics(c) ? [metrics(c)!] : []),
        ...(c.tags?.length ? [el('div', 'pf-kinetic-marquee', [el('div', 'pf-kinetic-marquee-track', [0, 1].map((copy) =>
          el('div', 'pf-kinetic-marquee-group', c.tags!.map((tag) => el('span', '', [tag, el('span', '', ['✳'], { 'aria-hidden': 'true' })])), copy ? { 'aria-hidden': 'true' } : {})))], { 'data-kinetic-animate': '', 'aria-label': 'Creative practice' })] : []),
      ]);
    }
    const intro = [title(section), ...(c.description ? [el('p', 'pf-description', [c.description], { 'data-kinetic-reveal': '' })] : [])];
    if (section.type === 'projects') return sectionShell(section, [...intro,
      el('div', 'pf-kinetic-projects', itemsFor(section).map((item) => {
        const visual = link(item.url, '', 'pf-kinetic-project-target');
        visual.attrs['aria-label'] = `View ${item.title || 'untitled'} project`;
        visual.attrs['data-kinetic-reveal'] = '';
        visual.children = [
          el('div', `pf-kinetic-project-scene pf-kinetic-visual-${item.visual || 'dashboard'}`, [
            el('div', 'pf-kinetic-project-type', [0, 1].map(() => el('span', '', [item.title || 'Selected work', ' — ']))),
            el('div', 'pf-kinetic-project-layer', [el('div', 'pf-kinetic-project-object', [art(item.visual)], { 'data-kinetic-tilt': '' })]),
            el('div', 'pf-kinetic-project-token', [el('span', '', [item.title.trim().slice(0, 2) || '✳'])]),
            el('span', 'pf-kinetic-concept', ['Concept study']),
          ], { 'aria-hidden': 'true', 'data-kinetic-animate': '' }),
          ...(visual.tag === 'a' ? [el('span', 'pf-kinetic-project-open', [el('span', '', ['✳'], { 'aria-hidden': 'true' }), 'View project'])] : []),
        ];
        return el('article', 'pf-kinetic-project', [visual,
          el('div', 'pf-kinetic-project-copy', [entry(item)], { 'data-kinetic-reveal': '' }),
        ], { 'data-kinetic-scroll': '' });
      })),
    ]);
    if (section.type === 'contact') return sectionShell(section, [...intro, ...(action(c) ? [action(c)!] : []),
      el('div', 'pf-kinetic-contact-links', (c.items ?? []).map((item) => entry(item))),
    ]);
    return sectionShell(section, [...intro, ...(tags(c.tags) ? [tags(c.tags)!] : []),
      ...(itemsFor(section).length ? [el('div', 'pf-kinetic-records', itemsFor(section).map((item) => entry(item)), { 'data-kinetic-reveal': '' })] : []),
    ]);
  }), 'pf-kinetic-main');
  const page = pageFrame(document, body, '', header);
  page.attrs['data-kinetic-page'] = '';
  return page;
}

export const KINETIC_CSS = `
.pf-kinetic{overflow-x:clip}
.pf-kinetic{position:relative}.pf-kinetic .pf-description{font-size:1rem;line-height:1.85;max-width:62ch}.pf-kinetic .pf-eyebrow{font-size:.875rem;letter-spacing:.02em;text-transform:none;margin-bottom:1.5rem;color:var(--pf-muted)}.pf-kinetic-header{position:relative;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:2rem;max-width:1600px;margin:auto;padding:1.75rem clamp(1.25rem,4cqi,4rem);border-bottom:1px solid var(--pf-border)}.pf-kinetic-brand{display:flex;align-items:center;gap:.8rem;font-size:1.1rem;font-weight:500;flex-shrink:0}.pf-kinetic-mark{display:grid;place-items:center;width:38px;height:38px;font-size:1.6rem;color:var(--pf-accent);border:1px solid var(--pf-border);border-radius:50%}.pf-kinetic .pf-nav{gap:.5rem 1.5rem;font-size:.875rem}.pf-kinetic-menu{display:none}.pf-kinetic-main{max-width:1600px;padding:0 clamp(1.25rem,4cqi,4rem)}.pf-kinetic .pf-section{padding:calc(var(--pf-space) * 1.35) 0;border-bottom:1px solid var(--pf-border)}.pf-kinetic .pf-hero{padding-top:2rem}.pf-kinetic-hero-top{display:flex;justify-content:space-between;align-items:center;gap:1rem;min-height:44px}.pf-kinetic .pf-kinetic-intro{font-size:.875rem;color:var(--pf-muted)}.pf-kinetic-motion{display:none;font-size:.875rem!important;border:1px solid var(--pf-border);border-radius:30px;padding:.6rem 1rem;min-height:44px;background:var(--pf-bg)}.pf-kinetic[data-kinetic-enhanced] .pf-kinetic-motion{display:inline-flex;align-items:center}.pf-kinetic-motion[aria-disabled=true]{color:var(--pf-muted);cursor:default}
.pf-kinetic-hero-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:1rem;align-items:center;min-height:530px;padding:2rem 0}.pf-kinetic h1.pf-kinetic-title{font-size:clamp(3.25rem,6.8cqi,7rem);font-weight:400;line-height:1.08;letter-spacing:-.065em;max-width:18ch;white-space:pre-line;text-wrap:balance}.pf-kinetic-word{display:inline-block;transform-origin:left bottom}.pf-kinetic-identity{display:flex;gap:1rem;align-items:center;margin-top:2.5rem}.pf-kinetic-avatar{display:grid;place-items:center;width:56px;height:56px;flex-shrink:0;background:var(--pf-surface);color:var(--pf-accent);border:1px solid var(--pf-border);border-radius:50%;overflow:hidden;font-size:1.1rem}.pf-kinetic-avatar img{display:block;width:100%;height:100%;object-fit:cover}.pf-kinetic-identity strong{font-size:1rem;font-weight:500}.pf-kinetic-identity p>span{display:block;color:var(--pf-muted);font-size:.875rem;margin-top:.2rem}.pf-kinetic-hero-scene{min-width:0;aspect-ratio:1/1;position:relative;perspective:1000px}.pf-kinetic-sculpture{position:absolute;inset:0;transform:rotateX(var(--pf-tilt-x,0deg)) rotateY(var(--pf-tilt-y,0deg));transition:transform .35s ease;transform-style:preserve-3d}.pf-kinetic-sphere{position:absolute;inset:17%;border-radius:50%;background:radial-gradient(circle at 28% 24%,color-mix(in srgb,var(--pf-accent) 20%,white),var(--pf-accent) 47%,color-mix(in srgb,var(--pf-accent) 32%,black) 90%);box-shadow:inset -15px -18px 45px #0002,0 35px 55px color-mix(in srgb,var(--pf-accent) 20%,transparent);animation:pf-kinetic-float 7s ease-in-out infinite;animation-play-state:paused}.pf-kinetic-orbit{position:absolute;inset:3%;border:1px solid var(--pf-accent);border-radius:50%;transform:rotate(-32deg) rotateX(60deg);z-index:2;animation:pf-kinetic-orbit 16s linear infinite;animation-play-state:paused}.pf-kinetic-orbit-back{inset:0;opacity:.3;transform:rotate(32deg) rotateY(65deg);animation-direction:reverse}.pf-kinetic-pebble{position:absolute;left:8%;top:25%;width:17%;height:17%;border-radius:28%;background:linear-gradient(140deg,var(--pf-bg),var(--pf-border));box-shadow:10px 15px 25px #0001;transform:rotate(-18deg) translateZ(35px)}.pf-kinetic-scene-label{position:absolute;inset:auto 0 0;text-align:center;color:var(--pf-muted);font-size:.875rem}.pf-kinetic-hero-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:2rem}.pf-kinetic-hero-bottom .pf-description{margin-top:0;max-width:48ch}.pf-kinetic-actions{display:flex;flex-wrap:wrap;gap:.75rem;flex-shrink:0;max-width:100%}.pf-kinetic .pf-action{margin-top:0;border:1px solid var(--pf-accent);border-radius:40px;min-height:48px;padding:.8rem 1.4rem;font-size:.875rem;font-weight:500;transition:transform .25s ease,box-shadow .25s ease}.pf-kinetic .pf-action:hover{transform:translateY(-3px);box-shadow:0 8px 18px #0001;text-decoration:none}.pf-kinetic-actions .pf-action+.pf-action{background:transparent;color:var(--pf-accent)!important}.pf-kinetic .pf-metrics{margin-top:2.5rem!important;padding:1.5rem 0;border-top:1px solid var(--pf-border);max-width:760px}.pf-kinetic .pf-metrics dd{font-size:1.125rem;font-weight:500;letter-spacing:-.02em}.pf-kinetic .pf-metrics dt{font-size:.875rem}
.pf-kinetic-marquee{overflow:hidden;margin-top:2rem;border-block:1px solid var(--pf-border);padding:1.25rem 0}.pf-kinetic-marquee-track{display:flex;width:max-content;animation:pf-kinetic-marquee 28s linear infinite;animation-play-state:paused}.pf-kinetic-marquee-group{display:flex;align-items:center;flex-shrink:0}.pf-kinetic-marquee-group>span{display:flex;align-items:center;gap:2rem;padding-right:2rem;font:400 clamp(1.2rem,2.4cqi,2rem)/1.4 var(--pf-heading-font);letter-spacing:-.03em;white-space:nowrap}.pf-kinetic-marquee-group>span>span{color:var(--pf-accent)}.pf-kinetic-section-heading h2{font-size:clamp(2.25rem,4.5cqi,4.5rem);font-weight:400;max-width:20ch;white-space:pre-line;line-height:1.15;letter-spacing:-.06em}.pf-kinetic-projects{display:grid;gap:4rem;margin-top:3rem}.pf-kinetic-project{min-width:0}.pf-kinetic-project-scene{position:relative;overflow:hidden;min-width:0;aspect-ratio:16/9;border:1px solid var(--pf-border);border-radius:4px;background:radial-gradient(ellipse at 65% 25%,color-mix(in srgb,var(--pf-accent) 17%,var(--pf-bg)),var(--pf-surface));perspective:1200px}.pf-kinetic-project-object{position:absolute;inset:10% 16%;transform:rotateX(var(--pf-tilt-x,0deg)) rotateY(var(--pf-tilt-y,0deg));transition:transform .35s ease;display:grid;place-items:center}.pf-kinetic-project-scene .pf-art{width:100%;min-height:0;height:100%;padding:clamp(1rem,3cqi,3rem);border:1px solid var(--pf-border);border-radius:12px;background:var(--pf-bg);box-shadow:0 25px 55px #0002;transform:rotate(-5deg);animation:pf-kinetic-project-float 8s ease-in-out infinite;animation-play-state:paused}.pf-kinetic-project-scene .pf-art-block{border-radius:6px;background:var(--pf-surface);border-color:var(--pf-border)}.pf-kinetic-project-scene .pf-art-block:first-child,.pf-kinetic-project-scene .pf-art-block:nth-child(4){background:var(--pf-accent)}.pf-kinetic-concept{position:absolute;left:1.5rem;bottom:1.25rem;font-size:.875rem;color:var(--pf-muted)}.pf-kinetic-visual-typography{background:linear-gradient(140deg,color-mix(in srgb,var(--pf-accent) 9%,var(--pf-bg)),color-mix(in srgb,var(--pf-accent) 25%,var(--pf-bg)))}.pf-kinetic-visual-typography .pf-art{transform:rotate(4deg);border-radius:50%;aspect-ratio:1;max-width:65%;justify-self:center}.pf-kinetic-visual-typography .pf-art-glyph{font-size:clamp(4rem,13cqi,12rem);color:var(--pf-accent)}.pf-kinetic-visual-typography .pf-art-caption{font-size:.875rem;color:var(--pf-muted);letter-spacing:.04em}.pf-kinetic-visual-mobile{background:linear-gradient(145deg,var(--pf-surface),color-mix(in srgb,var(--pf-accent) 13%,var(--pf-bg)))}.pf-kinetic-visual-mobile .pf-art{background:transparent;border:0;box-shadow:none;grid-template-columns:repeat(3,minmax(0,1fr));gap:5%;padding:1rem;transform:rotate(-6deg)}.pf-kinetic-visual-mobile .pf-art-block{min-height:0;height:90%;width:100%;border:6px solid var(--pf-text);background:var(--pf-bg);box-shadow:0 20px 40px #0002}.pf-kinetic-visual-mobile .pf-art-block:nth-child(2){background:var(--pf-accent);transform:translateY(15%) rotate(8deg)}.pf-kinetic-project-copy{margin-top:1.5rem}.pf-kinetic .pf-kinetic-project-copy h3{font-size:clamp(2.25rem,5cqi,5rem);font-weight:400;letter-spacing:-.06em;line-height:1.2}.pf-kinetic-project-copy .pf-meta{font-size:1rem!important;color:var(--pf-text);margin-top:.75rem}.pf-kinetic-project-copy .pf-description{max-width:65ch;margin-top:1rem}.pf-kinetic .pf-tags{gap:.5rem;margin-top:1.5rem!important}.pf-kinetic .pf-tags li{border-radius:30px;font-size:.875rem;background:transparent;padding:.4rem .85rem;color:var(--pf-muted)}
.pf-kinetic .pf-about{display:grid;grid-template-columns:1fr 1fr;gap:0 3rem}.pf-kinetic .pf-about>.pf-description{margin-top:0;align-self:center}.pf-kinetic .pf-about>.pf-tags{grid-column:2}.pf-kinetic-records{display:grid;gap:0;margin-top:2.5rem}.pf-kinetic-records>.pf-entry{padding:1.75rem 0;border-top:1px solid var(--pf-border)}.pf-kinetic-records h3{font-size:1.25rem;letter-spacing:-.025em;font-weight:500}.pf-kinetic .pf-meta{font-size:.875rem}.pf-kinetic .pf-skills .pf-kinetic-records{grid-template-columns:repeat(3,minmax(0,1fr));gap:2rem}.pf-kinetic .pf-contact .pf-kinetic-section-heading h2{font-size:clamp(2.5rem,5.5cqi,6rem);max-width:22ch}.pf-kinetic .pf-contact>.pf-action{margin-top:2rem}.pf-kinetic-contact-links{display:flex;flex-wrap:wrap;gap:1rem 2rem;margin-top:2rem}.pf-kinetic-contact-links h3{font-size:1rem;font-weight:500}.pf-kinetic-contact-links a{text-decoration:underline}.pf-kinetic .pf-footer{max-width:1600px;padding:2rem clamp(1.25rem,4cqi,4rem);font-size:.875rem}
.pf-kinetic[data-kinetic-enhanced]:not([data-kinetic-reduced]):not([data-kinetic-paused]) [data-kinetic-reveal]{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.7,.2,1)}.pf-kinetic[data-kinetic-enhanced]:not([data-kinetic-reduced]):not([data-kinetic-paused]) [data-kinetic-in-view]{opacity:1;transform:none}.pf-kinetic[data-kinetic-enhanced]:not([data-kinetic-reduced]):not([data-kinetic-paused]) .pf-kinetic-word{animation:pf-kinetic-enter .75s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--pf-word-index,0) * 45ms)}.pf-kinetic[data-kinetic-running] [data-kinetic-active] :is(.pf-kinetic-sphere,.pf-kinetic-orbit,.pf-art,.pf-kinetic-marquee-track){animation-play-state:running}.pf-kinetic[data-kinetic-reduced] *,.pf-kinetic[data-kinetic-paused] *{animation:none!important;transition:none!important}
@keyframes pf-kinetic-enter{from{opacity:0;transform:translateY(24px) rotate(3deg)}to{opacity:1;transform:none}}@keyframes pf-kinetic-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}@keyframes pf-kinetic-orbit{from{transform:rotate(-32deg) rotateX(60deg) rotateZ(0)}to{transform:rotate(-32deg) rotateX(60deg) rotateZ(360deg)}}@keyframes pf-kinetic-project-float{0%,100%{translate:0 0}50%{translate:0 -14px}}@keyframes pf-kinetic-marquee{to{transform:translateX(-50%)}}
@container(max-width:1000px){.pf-kinetic .pf-kinetic-desktop-nav{display:none}.pf-kinetic-menu{display:block}.pf-kinetic-menu summary{list-style:none;min-height:44px;display:flex;align-items:center;padding:.6rem 1rem;border:1px solid var(--pf-border);border-radius:30px;font-size:.875rem}.pf-kinetic-menu summary::-webkit-details-marker{display:none}.pf-kinetic-menu[open] .pf-nav{position:absolute;left:0;right:0;top:100%;padding:1rem 1.25rem;background:var(--pf-bg);border-block:1px solid var(--pf-border);box-shadow:0 15px 30px #0001}.pf-kinetic-hero-grid{min-height:430px}.pf-kinetic-hero-bottom{align-items:flex-start;flex-direction:column}.pf-kinetic-hero-bottom .pf-description{max-width:65ch}.pf-kinetic-scene-label{font-size:.8rem}.pf-kinetic .pf-skills .pf-kinetic-records{grid-template-columns:1fr;gap:0}}
@container(max-width:650px){.pf-kinetic-header{padding:1rem 1.25rem;gap:1rem}.pf-kinetic-brand{font-size:1rem;gap:.6rem}.pf-kinetic-mark{width:32px;height:32px;font-size:1.35rem}.pf-kinetic-hero-grid{grid-template-columns:1fr;gap:1.5rem;min-height:0;padding:2.5rem 0 2rem}.pf-kinetic h1.pf-kinetic-title{font-size:clamp(2.75rem,10cqi,4.5rem)}.pf-kinetic-hero-scene{width:min(100%,340px);justify-self:center}.pf-kinetic-hero-top{align-items:flex-start;gap:.6rem}.pf-kinetic .pf-kinetic-intro{font-size:.875rem;max-width:18ch}.pf-kinetic-motion{font-size:.8rem!important;padding:.5rem .75rem;flex-shrink:0}.pf-kinetic .pf-section{padding:var(--pf-space) 0}.pf-kinetic .pf-hero{padding-top:1.5rem}.pf-kinetic .pf-about{grid-template-columns:1fr;gap:1.5rem}.pf-kinetic .pf-about>.pf-tags{grid-column:1}.pf-kinetic .pf-metrics{grid-template-columns:1fr;gap:1rem}.pf-kinetic .pf-metrics>div{flex-direction:row;justify-content:space-between;gap:1rem}.pf-kinetic-projects{gap:3rem}.pf-kinetic-project-scene{aspect-ratio:1/1}.pf-kinetic-project-object{inset:15% 10%}.pf-kinetic-concept{font-size:.875rem;left:1rem;bottom:.75rem}.pf-kinetic-visual-typography .pf-art{max-width:90%;padding:1rem}.pf-kinetic-visual-typography .pf-art-glyph{font-size:clamp(4rem,24cqi,8rem)}.pf-kinetic-visual-mobile .pf-art-block{border-width:4px}.pf-kinetic .pf-kinetic-project-copy h3{font-size:clamp(2.25rem,10cqi,3.5rem)}.pf-kinetic-identity{margin-top:1.75rem}.pf-kinetic-identity p>span{max-width:24ch}.pf-kinetic .pf-art-caption{font-size:.75rem}}
.pf-kinetic-header{position:sticky;top:0;background:color-mix(in srgb,var(--pf-bg) 94%,transparent);backdrop-filter:blur(16px)}.pf-kinetic-header-tools{display:flex;align-items:center;gap:1.5rem;min-width:0}.pf-kinetic-brand{min-width:0;flex-shrink:1}.pf-kinetic-menu,.pf-kinetic-motion{flex-shrink:0}.pf-kinetic-hero-scene{translate:0 var(--pf-scroll-depth,0px)}.pf-kinetic-pebble{translate:var(--pf-scroll-counter,0px) 0}.pf-kinetic-marquee{padding:1.5rem 0}.pf-kinetic-marquee-group>span{font-size:clamp(2rem,5.5cqi,5.5rem);gap:2.5rem;padding-right:2.5rem;font-weight:400;letter-spacing:-.055em}.pf-kinetic-project-target{position:relative;display:block;text-decoration:none!important;isolation:isolate}.pf-kinetic-project-scene{aspect-ratio:16/10;border-radius:0}.pf-kinetic-project-layer{position:absolute;inset:0;z-index:2;transform:translate3d(0,var(--pf-scroll-depth,0px),0) rotate(var(--pf-scroll-turn,0deg)) scale(var(--pf-scroll-scale,1))}.pf-kinetic-project-object{inset:10% 18% 28%}.pf-kinetic-project-type{position:absolute;z-index:1;left:-.04em;bottom:-.05em;display:flex;width:max-content;gap:.08em;white-space:nowrap;pointer-events:none;font:400 clamp(5rem,20cqi,20rem)/1 var(--pf-heading-font);letter-spacing:-.075em;color:var(--pf-text);transform:translate3d(var(--pf-scroll-offset,0px),0,0)}.pf-kinetic-project-token{position:absolute;z-index:3;top:8%;left:6%;width:clamp(64px,10cqi,150px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;background:var(--pf-accent);color:var(--pf-on-accent);box-shadow:0 20px 45px #0002;transform:translate3d(0,var(--pf-scroll-counter,0px),0) rotate(calc(var(--pf-scroll-turn,0deg) * -2))}.pf-kinetic-project-token::before{content:'';position:absolute;inset:-12px;border:1px solid var(--pf-accent);border-radius:50%}.pf-kinetic-project-token>span{font:400 clamp(1.5rem,4cqi,4rem)/1 var(--pf-heading-font);letter-spacing:-.08em}.pf-kinetic-project-scene .pf-kinetic-concept{bottom:auto;top:1.5rem;left:auto;right:1.5rem;z-index:3}.pf-kinetic-project-open{position:absolute;z-index:4;right:2rem;bottom:2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;width:106px;height:106px;border:1px solid var(--pf-text);border-radius:50%;background:var(--pf-bg);color:var(--pf-text);font-size:.875rem;transition:background .25s,color .25s,scale .25s}.pf-kinetic-project-open>span{font-size:2rem;color:var(--pf-accent);transition:rotate .5s}.pf-kinetic-project-target:is(:hover,:focus-visible) .pf-kinetic-project-open{background:var(--pf-accent);color:var(--pf-on-accent);border-color:var(--pf-accent);scale:1.08}.pf-kinetic-project-target:is(:hover,:focus-visible) .pf-kinetic-project-open>span{color:var(--pf-on-accent);rotate:90deg}.pf-kinetic [data-kinetic-reveal]:focus-within{opacity:1!important;transform:none!important}
@container(max-width:1000px){.pf-kinetic-header-tools{gap:.75rem}}
@container(max-width:650px){.pf-kinetic-project-scene{aspect-ratio:4/5}.pf-kinetic-project-object{inset:18% 10% 30%}.pf-kinetic-project-type{font-size:clamp(4rem,24cqi,9rem)}.pf-kinetic-project-open{width:82px;height:82px;right:1rem;bottom:6rem;font-size:.75rem}.pf-kinetic-project-open>span{font-size:1.5rem}.pf-kinetic-project-scene .pf-kinetic-concept{top:1rem;right:1rem;font-size:.75rem}.pf-kinetic-project-token{top:8%;left:9%}.pf-kinetic h1.pf-kinetic-title{letter-spacing:-.05em}.pf-kinetic-header-tools{gap:.5rem}}
@container(max-width:420px){.pf-kinetic-header{gap:.5rem}.pf-kinetic-header .pf-kinetic-mark{display:none}.pf-kinetic-header .pf-kinetic-brand{font-size:.9rem}.pf-kinetic-header .pf-kinetic-menu summary{padding:.5rem .75rem}.pf-kinetic-header .pf-kinetic-motion{padding:.5rem .65rem}}
@media(prefers-reduced-motion:reduce){.pf-kinetic *,.pf-kinetic *::before,.pf-kinetic *::after{animation:none!important;transition:none!important}.pf-kinetic [data-kinetic-reveal]{opacity:1!important;transform:none!important}}
`;
