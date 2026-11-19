import { TemplateSchema } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionNames, entry, itemsFor, action, metrics, tags,
  type PortfolioDocument, type PortfolioElement } from './tree.js';

export const dossierTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000c',
  name: 'Sentinel / Cybersecurity Dossier', category: 'developer', isReact: false, thumbnailUrl: null,
  description: 'A cybersecurity portfolio with a neon-green terminal aesthetic, sidebar section navigation, investigation cards, capabilities, credentials, and research notes. All sample content is original and fictional.',
  defaultConfig: {
    theme: { layout: 'dossier', demo: true, font: 'mono', headingFont: 'mono', spacing: 'comfortable',
      colors: { background: '#060906', surface: '#0d140e', text: '#e3f0e0', muted: '#a2b59f', accent: '#7dff63', border: '#2b422b' } },
    sections: [
      { type: 'hero', visible: true, content: {
        eyebrow: 'Nadia Serrano / Cybersecurity Analyst', heading: 'Evidence first.\nDefense always.',
        subtitle: 'Detection engineering · Incident response · Cloud security',
        description: 'I turn noisy security signals into clear investigations and practical defenses. My work connects log analysis, repeatable response playbooks, and the small configuration changes that reduce real exposure.',
        buttonLabel: 'Start a conversation', buttonUrl: 'mailto:nadia@example.com',
        tags: ['Threat detection', 'Digital forensics', 'Security automation'],
        metrics: [{ value: 'Blue team', label: 'Primary focus' }, { value: 'Lab-based', label: 'Case-study evidence' }, { value: 'Open', label: 'Collaboration' }],
      } },
      { type: 'about', visible: true, content: {
        heading: 'The analyst behind the alerts.', subtitle: 'Profile / 01',
        description: 'I’m Nadia, a security analyst who enjoys asking what happened, how we know, and what should change next. I build small, well-documented labs to understand attacker behavior and test defensive ideas.\n\nMy approach is evidence-led: define the question, preserve the relevant artifacts, record the limits of the investigation, and leave the next analyst a clear trail. Every assessment in this portfolio uses a sandbox or an explicitly authorized environment.',
        tags: ['Curiosity', 'Clear documentation', 'Responsible research'],
      } },
      { type: 'projects', visible: true, content: {
        heading: 'Investigations with a paper trail.', subtitle: 'Selected case studies',
        description: 'Three fictional lab investigations, with the question, evidence, and defensive outcome kept together. Replace these examples with your own authorized work.',
        items: [
          { title: 'Lantern / Identity anomaly triage', subtitle: 'CASE 001 · DETECTION ENGINEERING',
            description: 'Built a sandbox sign-in dataset and a detection pipeline that links unusual session patterns with identity changes. Documented false-positive checks and a repeatable analyst triage worksheet.',
            url: 'https://example.com/nadia/lantern', tags: ['Sigma', 'Python', 'Identity logs'], visual: 'code',
            metrics: [{ value: 'Detect', label: 'Investigation focus' }] },
          { title: 'Breakwater / Cloud exposure review', subtitle: 'CASE 002 · CLOUD SECURITY',
            description: 'Reviewed an intentionally misconfigured cloud lab for public storage, broad permissions, and missing audit events. Produced a prioritized remediation record and checks that verify each change.',
            url: 'https://example.com/nadia/breakwater', tags: ['IAM', 'Terraform', 'CloudTrail'], visual: 'architecture',
            metrics: [{ value: 'Harden', label: 'Investigation focus' }] },
          { title: 'Tracebook / Endpoint evidence workflow', subtitle: 'CASE 003 · INCIDENT RESPONSE',
            description: 'Reconstructed a simulated endpoint incident from synthetic event logs and disk artifacts. Built a timeline, preserved evidence hashes, and wrote a handoff guide separating observations from assumptions.',
            url: 'https://example.com/nadia/tracebook', tags: ['Sysmon', 'Velociraptor', 'Timeline analysis'], visual: 'dashboard',
            metrics: [{ value: 'Respond', label: 'Investigation focus' }] },
        ],
      } },
      { type: 'skills', visible: true, content: {
        heading: 'A practical defensive toolkit.', subtitle: 'Capabilities',
        description: 'Tools support the investigation. Knowing what the data can and cannot show comes first.',
        tags: ['Python', 'Sigma', 'YARA', 'Wireshark', 'Sysmon', 'Linux', 'SQL', 'Git', 'Terraform'],
        items: [
          { title: 'Detection & triage', description: 'Log normalization, behavioral detections, alert enrichment, and evidence-based prioritization.' },
          { title: 'Incident investigation', description: 'Endpoint timelines, network artifact review, evidence handling, and readable response playbooks.' },
          { title: 'Cloud & automation', description: 'Identity reviews, configuration baselines, infrastructure checks, and small scripts that remove repetitive work.' },
        ],
      } },
      { type: 'experience', visible: true, content: {
        heading: 'Practice, collaboration, progress.', subtitle: 'Experience',
        description: 'Illustrative roles and organizations. Use this space for your own responsibilities and contributions.',
        items: [
          { title: 'Security Analyst · Alderwatch Labs', subtitle: '2025 — Present · Fictional example', description: 'Develop investigation notes, tune lab detections, and pair with engineers on configuration reviews. Turn recurring findings into documented checks and response steps.' },
          { title: 'Security Research Intern · Harborlight Collective', subtitle: '2024 — 2025 · Fictional example', description: 'Maintained a sandbox telemetry environment and wrote short research briefs on identity and endpoint detection opportunities.' },
        ],
      } },
      { type: 'education', visible: true, content: {
        heading: 'Learning that leaves evidence.', subtitle: 'Credentials & learning',
        description: 'Example learning records, not claims of professional certification. Add your own qualifications and verification links.',
        items: [
          { title: 'Defensive Operations Lab', subtitle: 'Example practical course · 2025', description: 'Investigation notebooks, detection exercises, and response handoffs.', url: 'https://example.com/nadia/learning/defensive-operations' },
          { title: 'Cloud Identity Workshop', subtitle: 'Example workshop · 2025', description: 'Least-privilege reviews and audit-log coverage in a disposable environment.', url: 'https://example.com/nadia/learning/cloud-identity' },
          { title: 'BSc Information Systems · Pinehaven Institute', subtitle: 'Fictional education example · 2020 — 2024', description: 'Networks, operating systems, and secure application fundamentals.' },
        ],
      } },
      { type: 'writing', visible: true, content: {
        heading: 'Notes from the investigation desk.', subtitle: 'Research notes',
        description: 'Short, reproducible explanations for other defenders. These are fictional article placeholders.',
        items: [
          { title: 'An alert is a question, not a verdict', subtitle: 'DETECTION NOTES · 2025', description: 'A checklist for testing a detection hypothesis before escalating an event.', url: 'https://example.com/nadia/notes/detection-hypotheses' },
          { title: 'Writing an incident timeline someone else can use', subtitle: 'RESPONSE NOTES · 2025', description: 'How to keep sources, timestamps, and uncertainty visible in an investigation handoff.', url: 'https://example.com/nadia/notes/incident-timelines' },
        ],
      } },
      { type: 'contact', visible: true, content: {
        heading: 'Let’s strengthen the next line of defense.', subtitle: 'Contact',
        description: 'Have a defensive security role, a research collaboration, or an authorized assessment in mind? Share the context and the problem you want to solve.',
        buttonLabel: 'Email Nadia', buttonUrl: 'mailto:nadia@example.com',
        items: [{ title: 'Email', url: 'mailto:nadia@example.com' }, { title: 'Code & lab notes', url: 'https://example.com/nadia/code' }, { title: 'Professional profile', url: 'https://example.com/nadia/profile' }],
      } },
    ],
  },
});

export function renderDossier(document: PortfolioDocument): PortfolioElement {
  const sections = document.sections.filter((section) => section.visible);
  const hero = sections.find((section) => section.type === 'hero');
  const name = hero?.content.eyebrow?.split('/')[0].trim() || 'Your name';
  const role = hero?.content.eyebrow?.split('/').slice(1).join('/').trim() || 'Security portfolio';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const labels = { hero: 'Overview', about: 'Profile', projects: 'Case studies', skills: 'Capabilities', experience: 'Experience', education: 'Credentials', writing: 'Research notes', contact: 'Contact', now: 'Currently', interactive: 'Lab' };
  const nav = () => el('nav', 'pf-dossier-nav', sections.map((section, index) => el('a', '', [
    el('span', 'pf-dossier-number', [String(index + 1).padStart(2, '0')], { 'aria-hidden': 'true' }), labels[section.type],
    el('span', 'pf-dossier-nav-arrow', ['↗'], { 'aria-hidden': 'true' }),
  ], { href: `#portfolio-${section.id}`, 'data-dossier-link': '' })), { 'aria-label': 'Security dossier sections' });
  const brand = () => el('div', 'pf-dossier-brand', [
    el('span', 'pf-dossier-monogram', [initials], { 'aria-hidden': 'true' }),
    el('div', '', [el('strong', '', [name]), el('span', '', [role])]),
  ]);
  const work = sections.find((section) => section.type === 'projects');
  const body = el('div', 'pf-dossier-shell', [
    el('header', 'pf-dossier-mobile', [brand(), el('details', 'pf-dossier-menu', [el('summary', '', ['Sections +']), nav()], { 'data-dossier-menu': '' })]),
    el('aside', 'pf-dossier-rail', [el('div', 'pf-dossier-rail-inner', [
      el('p', 'pf-dossier-system-label', ['SECURITY / PORTFOLIO']), brand(), nav(),
      el('p', 'pf-dossier-rail-note', ['Observe. Investigate. Improve.']),
    ])]),
    main(sections.map((section, index) => {
      const c = section.content;
      const items = itemsFor(section);
      const heading = el('div', 'pf-dossier-heading', [
        el('p', 'pf-dossier-path', [el('span', '', ['>_'], { 'aria-hidden': 'true' }), ` DOSSIER / ${labels[section.type].toUpperCase()}`]),
        el(section.type === 'hero' ? 'h1' : 'h2', '', [c.heading || sectionNames[section.type]]),
        c.subtitle && el('p', 'pf-dossier-subtitle', [c.subtitle]),
      ]);
      const panel = sectionShell(section, [
        heading,
        ...(c.description ? [el('p', 'pf-description', [c.description])] : []),
        ...(section.type === 'hero' ? [
          el('div', 'pf-dossier-actions', [work && el('a', 'pf-action', ['View case studies', el('span', '', [' ↗'], { 'aria-hidden': 'true' })], { href: `#portfolio-${work.id}` }), action(c)]),
          ...(metrics(c) ? [metrics(c)!] : []),
        ] : []),
        ...(tags(c.tags) ? [tags(c.tags)!] : []),
        ...(section.type === 'projects' ? [el('div', 'pf-dossier-cases', items.map((item, itemIndex) => el('article', 'pf-dossier-case', [
          el('div', 'pf-dossier-case-meta', [el('span', '', [`CASE / ${String(itemIndex + 1).padStart(3, '0')}`]),
            el('div', 'pf-dossier-stamps', (item.metrics ?? []).map((metric) => el('span', 'pf-dossier-stamp', [metric.value], { 'aria-label': `${metric.label}: ${metric.value}` })))]),
          entry(item),
        ])))] : []),
        ...(section.type !== 'projects' && items.length ? [el('div', 'pf-dossier-records', items.map((item) => entry(item)))] : []),
        ...(section.type === 'contact' ? [
          ...(action(c) ? [action(c)!] : []),
          el('div', 'pf-dossier-contact-links', (c.items ?? []).map((item) => entry(item))),
        ] : []),
        el('p', 'pf-dossier-panel-end', [`[ ${String(index + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')} ]`, el('span', '', ['END OF SECTION'])]),
      ], 'pf-dossier-panel');
      panel.attrs.tabindex = '-1';
      return panel;
    }), 'pf-dossier-main'),
  ], { 'data-dossier-shell': '' });
  return pageFrame(document, body);
}

export const DOSSIER_CSS = `
.pf-dossier{position:relative;background-image:linear-gradient(color-mix(in srgb,var(--pf-accent) 2%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pf-accent) 2%,transparent) 1px,transparent 1px);background-size:32px 32px;border:1px solid var(--pf-border)}
.pf-dossier::after{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(transparent 0,transparent 3px,color-mix(in srgb,var(--pf-bg) 14%,transparent) 3px,color-mix(in srgb,var(--pf-bg) 14%,transparent) 4px);opacity:.4}
.pf-dossier-shell{display:grid;grid-template-columns:250px minmax(0,1fr);min-height:740px}.pf-dossier-rail{border-right:1px solid var(--pf-border);background:var(--pf-surface);min-width:0}.pf-dossier-rail-inner{position:sticky;top:0;padding:2rem 1.4rem;display:flex;flex-direction:column;gap:2rem}.pf-dossier-system-label{font-size:.65rem;color:var(--pf-accent);letter-spacing:.12em}.pf-dossier-brand{display:flex;align-items:center;gap:.9rem;min-width:0}.pf-dossier-monogram{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border:1px solid var(--pf-accent);color:var(--pf-accent);font-size:1rem;font-weight:700;box-shadow:3px 3px 0 var(--pf-border)}.pf-dossier-brand strong{display:block;font-size:.85rem;font-style:italic;letter-spacing:-.03em}.pf-dossier-brand div>span{display:block;margin-top:.3rem;color:var(--pf-muted);font-size:.65rem;line-height:1.6}.pf-dossier-nav{display:flex;flex-direction:column;gap:.4rem}.pf-dossier-nav a{display:flex;align-items:center;gap:.8rem;min-height:44px;border-left:2px solid transparent;padding:.65rem .65rem .65rem .8rem;font-size:.75rem;color:var(--pf-muted);text-decoration:none}.pf-dossier-nav a:hover,.pf-dossier-nav a[aria-current]{border-left-color:var(--pf-accent);background:color-mix(in srgb,var(--pf-accent) 7%,transparent);color:var(--pf-text)}.pf-dossier-number{font-size:.65rem;color:var(--pf-accent)}.pf-dossier-nav-arrow{margin-left:auto;color:var(--pf-accent)}.pf-dossier-rail-note{border-top:1px solid var(--pf-border);padding-top:1.3rem;font-size:.65rem;color:var(--pf-muted);line-height:1.8}
.pf-dossier-main{width:100%;max-width:1180px;margin:0 auto;padding:0 clamp(1.25rem,4cqi,4rem);min-width:0}.pf-dossier .pf-section{padding:var(--pf-space) 0;border-bottom:1px solid var(--pf-border)}.pf-dossier-panel[hidden]{display:none}.pf-dossier .pf-dossier-path{display:flex;gap:.6rem;color:var(--pf-accent);font-size:.65rem;letter-spacing:.1em;margin-bottom:2.4rem}.pf-dossier .pf-dossier-path>span{letter-spacing:0}.pf-dossier .pf-dossier-heading h1,.pf-dossier .pf-dossier-heading h2{color:var(--pf-accent);font-style:italic;font-weight:700;letter-spacing:-.055em;text-transform:uppercase;white-space:pre-line;max-width:22ch;text-wrap:balance}.pf-dossier .pf-dossier-heading h1{font-size:clamp(2rem,4.3cqi,4rem);line-height:1.12}.pf-dossier .pf-dossier-heading h2{font-size:clamp(1.65rem,3.2cqi,2.75rem);line-height:1.2}.pf-dossier .pf-dossier-subtitle{margin-top:1.5rem;font-size:.8rem;line-height:1.8;color:var(--pf-text)}.pf-dossier .pf-description{font-size:.85rem;line-height:1.95;max-width:70ch;margin-top:1.5rem}.pf-dossier-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;margin-top:1.75rem}.pf-dossier .pf-action{border:1px solid var(--pf-accent);border-radius:0;font-size:.75rem;gap:.5rem}.pf-dossier-actions .pf-action{margin-top:0}.pf-dossier-actions .pf-action+.pf-action{background:transparent;color:var(--pf-accent)!important}.pf-dossier .pf-metrics{gap:0;border:1px solid var(--pf-border);background:var(--pf-surface);margin-top:2.5rem!important}.pf-dossier .pf-metrics>div{padding:1.2rem;gap:.5rem;border-right:1px solid var(--pf-border)}.pf-dossier .pf-metrics>div:last-child{border-right:0}.pf-dossier .pf-metrics dd{font-size:1.1rem;color:var(--pf-accent);letter-spacing:-.04em}.pf-dossier .pf-metrics dt{font-size:.65rem}.pf-dossier .pf-tags{gap:.6rem;margin-top:1.5rem!important}.pf-dossier .pf-tags li{padding:.3rem .55rem;border-radius:0;background:transparent;font-size:.65rem}.pf-dossier-panel-end{margin-top:3rem!important;display:flex;justify-content:space-between;gap:1rem;padding-top:1rem;border-top:1px dashed var(--pf-border);color:var(--pf-muted);font-size:.6rem;letter-spacing:.1em}
.pf-dossier-cases,.pf-dossier-records{display:grid;gap:1rem;margin-top:2rem}.pf-dossier-case,.pf-dossier-records>.pf-entry{padding:1.5rem;border:1px solid var(--pf-border);background:var(--pf-surface)}.pf-dossier-case-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;align-items:center;font-size:.65rem;color:var(--pf-accent);margin-bottom:1rem}.pf-dossier-stamps{display:flex;flex-wrap:wrap;gap:.5rem}.pf-dossier-stamp{padding:.15rem .55rem;border:1px solid var(--pf-accent);text-transform:uppercase}.pf-dossier .pf-entry h3{font-size:1rem;line-height:1.65;letter-spacing:-.02em}.pf-dossier .pf-entry h3 a{color:var(--pf-text);text-decoration:underline;text-decoration-color:var(--pf-border)}.pf-dossier .pf-entry h3 a:hover{color:var(--pf-accent);text-decoration-color:currentColor}.pf-dossier .pf-entry .pf-meta{font-size:.65rem;color:var(--pf-accent);margin-top:.6rem}.pf-dossier .pf-entry .pf-description{font-size:.8rem;margin-top:1rem}.pf-dossier-contact-links{display:flex;flex-wrap:wrap;gap:1rem 2rem;margin-top:2rem}.pf-dossier-contact-links .pf-entry h3{font-size:.8rem}.pf-dossier .pf-footer{max-width:none;padding:1.5rem 2rem;border-top:1px solid var(--pf-border);font-size:.65rem}.pf-dossier-mobile{display:none}
@container(max-width:780px){.pf-dossier-shell{grid-template-columns:minmax(0,1fr);min-height:0}.pf-dossier-rail{display:none}.pf-dossier-mobile{position:relative;z-index:5;display:flex;justify-content:space-between;gap:1rem;align-items:center;border-bottom:1px solid var(--pf-border);background:var(--pf-surface);padding:1rem 1.25rem;min-width:0}.pf-dossier-mobile .pf-dossier-brand{gap:.7rem}.pf-dossier-mobile .pf-dossier-brand strong{font-size:.75rem}.pf-dossier-mobile .pf-dossier-brand div>span{font-size:.6rem}.pf-dossier-mobile .pf-dossier-monogram{width:32px;height:32px;font-size:.8rem}.pf-dossier-menu{flex-shrink:0}.pf-dossier-menu summary{min-height:44px;display:flex;align-items:center;border:1px solid var(--pf-border);padding:.6rem .7rem;font-size:.65rem;list-style:none;color:var(--pf-accent)}.pf-dossier-menu summary::-webkit-details-marker{display:none}.pf-dossier-menu[open] .pf-dossier-nav{position:absolute;left:0;right:0;top:100%;background:var(--pf-surface);padding:1rem 1.25rem;border-bottom:1px solid var(--pf-accent);box-shadow:0 15px 25px #0008}.pf-dossier-main{padding:0 1.25rem}.pf-dossier .pf-dossier-heading h1{font-size:clamp(2rem,6.5cqi,3.5rem)}.pf-dossier .pf-dossier-heading h2{font-size:clamp(1.65rem,5cqi,2.5rem)}.pf-dossier .pf-dossier-path{margin-bottom:1.75rem}.pf-dossier .pf-footer{padding:1.5rem 1.25rem}}
@container(max-width:420px){.pf-dossier .pf-metrics{grid-template-columns:1fr}.pf-dossier .pf-metrics>div{flex-direction:row;align-items:baseline;justify-content:space-between;padding:.8rem 1rem;border-right:0;border-bottom:1px solid var(--pf-border)}.pf-dossier .pf-metrics>div:last-child{border-bottom:0}.pf-dossier-case,.pf-dossier-records>.pf-entry{padding:1rem}.pf-dossier-mobile{gap:.5rem}.pf-dossier-mobile .pf-dossier-brand{gap:.5rem}.pf-dossier-mobile .pf-dossier-monogram{display:none}.pf-dossier .pf-dossier-heading h1{font-size:clamp(1.75rem,8cqi,2.5rem)}}
`;
