import { TemplateSchema } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, entry, itemsFor, action, metrics, tags, navigation, type PortfolioDocument } from './tree.js';

export const terminalTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000002', name: 'The Terminal / Cyberpunk', category: 'developer', isReact: true, thumbnailUrl: null,
  description: 'A compact, phosphor-lit command-line portfolio for engineers who make complex systems dependable.',
  defaultConfig: { theme: { layout: 'terminal', demo: true, colors: { background: '#0B0F0C', text: '#E4F1E8', accent: '#86EFAC', muted: '#A0B4A6', surface: '#101812', border: '#2C4332' }, font: 'mono', headingFont: 'mono', spacing: 'compact' }, sections: [
    { type: 'hero', visible: true, content: { eyebrow: 'Jules Park / Infrastructure engineer', heading: 'Systems that stay boring. In the best way.', subtitle: 'Backend · Platform · Reliability', description: 'I build the infrastructure behind the interface: observable services, repeatable deployments, and failure modes you can actually explain. Based in Toronto. Comfortable on call.', buttonLabel: 'open contact →', buttonUrl: 'mailto:jules@example.com', tags: ['Go', 'Rust', 'Linux'], metrics: [{ value: '99.95%', label: 'Example service SLO' }, { value: '8 min', label: 'Recovery drill target' }, { value: '42', label: 'Runbooks maintained' }] } },
    { type: 'experience', visible: true, content: { heading: 'git log --experience', description: 'A changelog of problems I’ve helped make smaller.', items: [
      { title: 'Staff Platform Engineer · Signal Harbor', subtitle: '2024 → HEAD', description: 'Standardized service ownership and rollback paths across 18 services. Turned incident reviews into tracked reliability improvements.', tags: ['Kubernetes', 'OpenTelemetry', 'Go'] },
      { title: 'Backend Engineer · Packet Works', subtitle: '2021 → 2024', description: 'Built event ingestion and idempotent processing pipelines. Replaced manual release steps with repeatable, reviewable automation.', tags: ['PostgreSQL', 'Terraform', 'Kafka'] },
    ] } },
    { type: 'projects', visible: true, content: { heading: 'ls ~/repositories', description: 'Small tools. Clear contracts. Fewer surprises.', items: [
      { title: 'watchtower', subtitle: 'Service health without the guesswork', description: 'A lightweight probe runner with useful exit codes, structured logs, and an intentionally small configuration surface.', url: 'https://example.com/watchtower', tags: ['Go', 'Observability'] },
      { title: 'driftctl-lab', subtitle: 'Infrastructure changes, explained', description: 'An experimental plan reviewer that annotates infrastructure diffs with ownership and rollback notes.', url: 'https://example.com/driftctl-lab', tags: ['Rust', 'Terraform'] },
      { title: 'queue-notes', subtitle: 'Distributed systems, tested locally', description: 'Executable notes on retries, idempotency, dead letters, and what happens when the worker disappears.', url: 'https://example.com/queue-notes', tags: ['TypeScript', 'Redis'] },
    ] } },
    { type: 'skills', visible: true, content: { heading: 'cat toolchain.toml', description: 'Tools I reach for after understanding the constraints.', items: [
      { title: '[languages]', description: 'Go · Rust · Python · TypeScript · SQL' },
      { title: '[platform]', description: 'Linux · Docker · Kubernetes · Terraform · GitHub Actions' },
      { title: '[practice]', description: 'Threat modeling · SLOs · Incident response · Capacity planning' },
    ] } },
    { type: 'about', visible: true, content: { heading: 'cat README.md', description: 'I’m Jules. I like tracing a vague symptom to a concrete cause, writing down what I learn, and leaving a system easier to operate than I found it.\n\nMy favorite fix is often a smaller abstraction, a better error message, or a runbook someone can trust at 3 a.m.' } },
    { type: 'contact', visible: true, content: { heading: './connect', subtitle: 'No handshake ceremony required.', description: 'Working on a reliability problem, an infrastructure tool, or a team that values operational craft? Send a note. The shell below supports help, email, links, and clear.', buttonLabel: 'jules@example.com', buttonUrl: 'mailto:jules@example.com' } },
  ] },
});

export function renderTerminal(document: PortfolioDocument) {
  const sections = document.sections.filter((s) => s.visible), hero = sections.find((s) => s.type === 'hero');
  const header = el('header', 'pf-terminal-chrome', [el('div', 'pf-window-dots', [el('span', '', []), el('span', '', []), el('span', '', [])], { 'aria-hidden': 'true' }),
    el('p', '', [hero?.content.eyebrow || 'portfolio / terminal']), el('span', 'pf-terminal-label', ['LOCAL SESSION'])]);
  return pageFrame(document, main([navigation(sections), ...sections.map((section) => {
    const c = section.content;
    if (section.type === 'hero') return sectionShell(section, [el('p', 'pf-terminal-prompt', ['$ npm run introduce']), ...sectionHeading(section),
      ...(c.subtitle ? [el('p', 'pf-subtitle', [c.subtitle])] : []), ...(tags(c.tags) ? [tags(c.tags)!] : []), ...(metrics(c) ? [metrics(c)!] : []), ...(action(c) ? [action(c)!] : [])]);
    if (section.type === 'contact') {
      const inputId = `shell-${section.id}`;
      return sectionShell(section, [...sectionHeading(section), ...(c.subtitle ? [el('p', 'pf-subtitle', [c.subtitle])] : []),
        el('form', 'pf-shell', [action(c), el('p', 'pf-meta', ['Local commands only · try “help”']),
          el('div', 'pf-shell-row', [el('label', 'pf-terminal-prompt', ['>_'], { for: inputId }),
            el('input', '', [], { id: inputId, type: 'text', 'aria-label': 'Contact command', placeholder: 'help', maxlength: '80', autocomplete: 'off', spellcheck: 'false' }),
            el('button', '', ['Run command'], { type: 'submit' })]),
          el('div', 'pf-shell-output', [], { 'data-shell-output': '', role: 'status', 'aria-live': 'polite' })],
          { 'data-portfolio-shell': '', 'data-email': c.buttonUrl?.startsWith('mailto:') ? c.buttonUrl.slice(7) : '', action: `#portfolio-${section.id}` })]);
    }
    const content = itemsFor(section);
    if (section.type === 'experience') return sectionShell(section, [...sectionHeading(section), el('ol', 'pf-terminal-log', content.map((item) =>
      el('li', '', [el('p', 'pf-log-date', [item.subtitle || 'Recorded']), entry({ ...item, subtitle: undefined })])))]);
    if (section.type === 'projects') return sectionShell(section, [...sectionHeading(section), el('div', 'pf-repositories', content.map((item) =>
      el('article', 'pf-repository', [el('span', 'pf-repo-mark', ['↳'], { 'aria-hidden': 'true' }), entry(item)])))]);
    return sectionShell(section, [...sectionHeading(section), ...(tags(c.tags) ? [tags(c.tags)!] : []),
      ...(content.length ? [el('div', 'pf-toolchain', content.map((item) => entry(item)))] : [])]);
  })], 'pf-terminal-body'), 'pf-terminal-window', header);
}
export const TERMINAL_CSS = `
.pf-terminal{max-width:1080px;margin:2.5rem auto;border:1px solid var(--pf-border);border-radius:8px;overflow:hidden;box-shadow:0 20px 100px #00000030;font-size:14px}.pf-terminal-chrome{padding:1rem 1.5rem;display:flex;align-items:center;gap:1.5rem;background:var(--pf-surface);border-bottom:1px solid var(--pf-border);font-size:.7rem;color:var(--pf-muted)}.pf-window-dots{display:flex;gap:6px;flex-shrink:0}.pf-window-dots span{width:8px;height:8px;border-radius:50%;border:1px solid var(--pf-muted)}.pf-window-dots span:first-child{background:var(--pf-accent);border-color:var(--pf-accent)}.pf-terminal-label{margin-left:auto;font-size:.6rem;letter-spacing:.1em}.pf-terminal .pf-main{padding:0 2.5rem}.pf-terminal .pf-nav{padding:.5rem 0;border-bottom:1px dashed var(--pf-border);gap:.25rem 1.25rem;font-size:.7rem}.pf-terminal .pf-nav a::before{content:'./';color:var(--pf-accent)}
.pf-terminal .pf-hero{padding-top:3rem}.pf-terminal h1{font-size:clamp(1.8rem,4.6cqi,3.25rem);line-height:1.25;letter-spacing:-.055em;max-width:24ch}.pf-terminal h2{font-size:1rem;letter-spacing:-.03em;color:var(--pf-accent)}.pf-terminal h3{font-size:.85rem;letter-spacing:-.02em}.pf-terminal .pf-description{font-size:.8rem;line-height:1.9}.pf-terminal-prompt{color:var(--pf-accent);font-size:.8rem;margin-bottom:1rem!important}.pf-terminal .pf-subtitle{font-size:.8rem}.pf-terminal .pf-tags{margin-top:1rem!important}.pf-terminal .pf-tags li{font-size:.65rem;border-radius:2px;padding:.2rem .5rem}.pf-terminal .pf-metrics{border-top:1px dashed var(--pf-border);padding-top:1.5rem;margin-top:1.5rem!important}.pf-terminal .pf-metrics dd{color:var(--pf-accent);font-size:1.5rem}.pf-terminal .pf-metrics dt{font-size:.65rem}.pf-terminal .pf-action{background:none;border:1px solid var(--pf-accent);border-radius:2px;color:var(--pf-accent)!important;font-size:.75rem}
.pf-terminal-log{padding:0;list-style:none;margin-top:1.5rem!important}.pf-terminal-log>li{display:grid;grid-template-columns:140px 1fr;gap:1.5rem;padding:1.25rem 0;border-bottom:1px dashed var(--pf-border)}.pf-log-date{color:var(--pf-accent);font-size:.7rem}.pf-terminal-log .pf-description{margin-top:.5rem}.pf-repositories{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:1.5rem}.pf-repository{padding:1.25rem;border:1px solid var(--pf-border);background:var(--pf-surface);min-width:0}.pf-repo-mark{display:block;color:var(--pf-accent);font-size:1.5rem;margin-bottom:.5rem}.pf-repository .pf-meta{font-size:.65rem}.pf-toolchain{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2rem;margin-top:1.5rem}.pf-toolchain h3{color:var(--pf-accent)}.pf-toolchain .pf-description{margin-top:.5rem}
.pf-shell{padding:0 1.25rem 1.25rem;margin-top:1.5rem;border:1px solid var(--pf-border);background:var(--pf-surface)}.pf-shell-row{display:flex;align-items:center;gap:.75rem;margin-top:1.25rem}.pf-shell-row label{margin:0!important}.pf-shell input{min-width:0;flex:1;width:100%;background:var(--pf-bg);border:1px solid var(--pf-muted);border-radius:2px;padding:.7rem;font-size:.8rem}.pf-shell input::placeholder{color:var(--pf-muted);opacity:1}.pf-shell button{border:1px solid var(--pf-accent);background:var(--pf-accent);color:var(--pf-on-accent);min-height:44px;font-size:.7rem;padding:.6rem .75rem}.pf-shell-output{white-space:pre-wrap;font-size:.75rem;color:var(--pf-accent);line-height:1.8}.pf-shell-output p{padding-top:1rem}.pf-terminal .pf-footer{font-size:.6rem;padding:1.5rem 2.5rem}
@container(max-width:650px){.pf-repositories{grid-template-columns:1fr}.pf-toolchain{grid-template-columns:1fr;gap:1.25rem}.pf-terminal-log>li{grid-template-columns:1fr;gap:.5rem}.pf-terminal .pf-main{padding:0 1.25rem}.pf-terminal-chrome{gap:.75rem;padding:.75rem 1.25rem}.pf-terminal-label{display:none}.pf-shell-row{flex-wrap:wrap}.pf-shell input{flex-basis:65%}.pf-shell button{margin-left:2rem}.pf-terminal .pf-footer{padding:1.5rem 1.25rem}}
@media(max-width:700px){.pf-terminal{margin:0;border-radius:0;border-width:0}}
`;
