import { TemplateSchema } from '../validation/template.schema.js';

export const terminalNoirTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000a',
  name: 'Terminal Noir',
  category: 'developer',
  isReact: false,
  thumbnailUrl: null,
  description: 'UNIX meets late-night hacker den — pure black, acid green, monospace everything. Structured like data, reads like a story.',
  defaultConfig: {
    theme: {
      layout: 'terminal',
      demo: true,
      colors: {
        background: '#000000',
        surface:    '#0d1117',
        text:       '#c9d1d9',
        muted:      '#7d8590',
        accent:     '#39d353',
        border:     '#30363d',
      },
      font: 'mono',
      headingFont: 'mono',
      spacing: 'compact',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: '~/portfolio $ whoami',
          heading: 'alex_chen — security engineer',
          subtitle: '> Specialisation: application security, threat modelling, secure SDLC',
          description: '> Based in Singapore. 9 years breaking things so production doesn\'t have to.\n> Currently: staff security engineer at Irongate Systems.\n> Side project: building open-source static analysis tooling.',
          buttonLabel: './contact ↗',
          buttonUrl: 'mailto:alex@example.com',
          tags: ['Rust', 'Python', 'Go', 'OWASP'],
          metrics: [
            { value: '200+', label: 'CVEs triaged and remediated' },
            { value: '14',   label: 'Penetration tests conducted' },
            { value: '9 yrs', label: 'Application security experience' },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'ls ~/repositories',
          description: '# open-source security tooling',
          items: [
            {
              title: 'taint — dataflow analysis for Node.js apps',
              subtitle: 'a9f3d12 · 2026-04',
              description: 'Static analysis tool that traces user-controlled data through Express middleware to identify injection sinks before code review.',
              url: 'https://example.com/taint',
              visual: 'code',
              tags: ['Rust', 'AST analysis', 'Node.js'],
            },
            {
              title: 'boundary — a secrets rotation daemon',
              subtitle: 'c7e1b8a · 2025-11',
              description: 'Automatically rotates API keys and database credentials on a configurable schedule with zero-downtime hot-reload support.',
              url: 'https://example.com/boundary',
              visual: 'code',
              tags: ['Go', 'Vault', 'Kubernetes'],
            },
            {
              title: 'redline — supply chain audit CLI',
              subtitle: 'f2d4096 · 2025-06',
              description: 'Scans npm and PyPI dependency trees for known-vulnerable transitive dependencies and generates a prioritised remediation report.',
              url: 'https://example.com/redline',
              visual: 'code',
              tags: ['Python', 'SBOM', 'CVE'],
            },
          ],
        },
      },
      {
        type: 'experience', visible: true,
        content: {
          heading: 'git log --experience --oneline',
          description: '',
          items: [
            {
              title: 'Staff Security Engineer · Irongate Systems',
              subtitle: '2022 → HEAD',
              description: 'Own application security across a 40-service microservices platform. Run quarterly threat model reviews and lead the secure-by-default engineering initiative.',
            },
            {
              title: 'Security Engineer · Cipher Foundry',
              subtitle: '2018 → 2022',
              description: 'Embedded security engineer in product squads. Introduced automated SAST into CI, reducing critical findings at code review by 70 %.',
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: 'cat toolchain.toml',
          description: '',
          tags: ['Rust', 'Python', 'Go', 'Burp Suite', 'OWASP', 'Kubernetes', 'AWS', 'Threat Modelling'],
          items: [
            { title: '[languages]',   description: 'Rust · Python · Go · Bash · SQL' },
            { title: '[appsec]',      description: 'SAST · DAST · Penetration testing · Threat modelling · SBOM · CVE triage' },
            { title: '[platform]',    description: 'Kubernetes · AWS · Vault · GitHub Actions · Docker · Terraform' },
          ],
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: './connect --open',
          subtitle: 'No ceremony required.',
          description: 'Working on a hard security problem, an open-source tool, or a team that takes the SDLC seriously? Send a message. The shell below supports help, email, links, and clear.',
          buttonLabel: 'alex@example.com',
          buttonUrl: 'mailto:alex@example.com',
        },
      },
    ],
  },
});
