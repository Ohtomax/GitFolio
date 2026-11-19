# Terminal Noir

Category: `developer` · Audience: Systems, infrastructure, DevOps, and security engineers · Output: static HTML/CSS/JS

UNIX meets late-night hacker den — pure black, acid green, monospace everything. Structured like data, reads like a story.

A compact command-line session, dated experience log, repository grid, tools inventory, and a local command-based contact form. Prompts and window chrome carry the identity.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#39d353` |
| background | `#000000` |
| text | `#c9d1d9` |
| muted | `#7d8590` |
| surface | `#0d1117` |
| border | `#30363d` |
| Body family | 'Geist Mono', ui-monospace, monospace |
| Heading family | 'Geist Mono', ui-monospace, monospace |
| Font styles | body: mono; heading: mono |
| Density | compact |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 13.61:1 | 12.26:1 |
| muted | 5.63:1 | 5.07:1 |
| accent | 10.62:1 | 9.57:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → Projects → Experience → Skills → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — alex_chen — security engineer

Eyebrow: ~/portfolio $ whoami

Subtitle: > Specialisation: application security, threat modelling, secure SDLC

> Based in Singapore. 9 years breaking things so production doesn't have to.
> Currently: staff security engineer at Irongate Systems.
> Side project: building open-source static analysis tooling.

Tags: Rust · Python · Go · OWASP

- **200+** — CVEs triaged and remediated
- **14** — Penetration tests conducted
- **9 yrs** — Application security experience

CTA: [./contact ↗](mailto:alex@example.com)

### 2. Projects — ls ~/repositories

# open-source security tooling

- **taint — dataflow analysis for Node.js apps** — a9f3d12 · 2026-04
  Static analysis tool that traces user-controlled data through Express middleware to identify injection sinks before code review.
  Stack: Rust · AST analysis · Node.js
  Link: https://example.com/taint
  Decorative cover: code
- **boundary — a secrets rotation daemon** — c7e1b8a · 2025-11
  Automatically rotates API keys and database credentials on a configurable schedule with zero-downtime hot-reload support.
  Stack: Go · Vault · Kubernetes
  Link: https://example.com/boundary
  Decorative cover: code
- **redline — supply chain audit CLI** — f2d4096 · 2025-06
  Scans npm and PyPI dependency trees for known-vulnerable transitive dependencies and generates a prioritised remediation report.
  Stack: Python · SBOM · CVE
  Link: https://example.com/redline
  Decorative cover: code

### 3. Experience — git log --experience --oneline

- **Staff Security Engineer · Irongate Systems** — 2022 → HEAD
  Own application security across a 40-service microservices platform. Run quarterly threat model reviews and lead the secure-by-default engineering initiative.
- **Security Engineer · Cipher Foundry** — 2018 → 2022
  Embedded security engineer in product squads. Introduced automated SAST into CI, reducing critical findings at code review by 70 %.

### 4. Skills — cat toolchain.toml

Tags: Rust · Python · Go · Burp Suite · OWASP · Kubernetes · AWS · Threat Modelling

- **[languages]**
  Rust · Python · Go · Bash · SQL
- **[appsec]**
  SAST · DAST · Penetration testing · Threat modelling · SBOM · CVE triage
- **[platform]**
  Kubernetes · AWS · Vault · GitHub Actions · Docker · Terraform

### 5. Contact — ./connect --open

Subtitle: No ceremony required.

Working on a hard security problem, an open-source tool, or a team that takes the SDLC seriously? Send a message. The shell below supports help, email, links, and clear.

CTA: [alex@example.com](mailto:alex@example.com)
