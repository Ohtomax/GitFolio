# Sentinel / Cybersecurity Dossier

Category: `developer` · Audience: Cybersecurity analysts, detection engineers, and incident responders · Output: static HTML/CSS/JS

A cybersecurity portfolio with a neon-green terminal aesthetic, sidebar section navigation, investigation cards, capabilities, credentials, and research notes. All sample content is original and fictional.

A neon-green terminal dashboard with a persistent identity rail, numbered section navigation, evidence-oriented case cards, defensive capabilities, career entries, learning records, research notes, and contact links. Interactive previews and exports switch between sections; the editor and no-JavaScript output keep all sections readable. The reference informed the visual treatment only; all example data is original.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#7dff63` |
| background | `#060906` |
| text | `#e3f0e0` |
| muted | `#a2b59f` |
| surface | `#0d140e` |
| border | `#2b422b` |
| Body family | 'Geist Mono', ui-monospace, monospace |
| Heading family | 'Geist Mono', ui-monospace, monospace |
| Font styles | body: mono; heading: mono |
| Density | comfortable |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 16.97:1 | 15.85:1 |
| muted | 9.19:1 | 8.59:1 |
| accent | 15.59:1 | 14.56:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → About → Projects → Skills → Experience → Education → Writing → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — Evidence first.
Defense always.

Eyebrow: Nadia Serrano / Cybersecurity Analyst

Subtitle: Detection engineering · Incident response · Cloud security

I turn noisy security signals into clear investigations and practical defenses. My work connects log analysis, repeatable response playbooks, and the small configuration changes that reduce real exposure.

Tags: Threat detection · Digital forensics · Security automation

- **Blue team** — Primary focus
- **Lab-based** — Case-study evidence
- **Open** — Collaboration

CTA: [Start a conversation](mailto:nadia@example.com)

### 2. About — The analyst behind the alerts.

Subtitle: Profile / 01

I’m Nadia, a security analyst who enjoys asking what happened, how we know, and what should change next. I build small, well-documented labs to understand attacker behavior and test defensive ideas.

My approach is evidence-led: define the question, preserve the relevant artifacts, record the limits of the investigation, and leave the next analyst a clear trail. Every assessment in this portfolio uses a sandbox or an explicitly authorized environment.

Tags: Curiosity · Clear documentation · Responsible research

### 3. Projects — Investigations with a paper trail.

Subtitle: Selected case studies

Three fictional lab investigations, with the question, evidence, and defensive outcome kept together. Replace these examples with your own authorized work.

- **Lantern / Identity anomaly triage** — CASE 001 · DETECTION ENGINEERING
  Built a sandbox sign-in dataset and a detection pipeline that links unusual session patterns with identity changes. Documented false-positive checks and a repeatable analyst triage worksheet.
  Stack: Sigma · Python · Identity logs
  Link: https://example.com/nadia/lantern
  Decorative cover: code
- **Breakwater / Cloud exposure review** — CASE 002 · CLOUD SECURITY
  Reviewed an intentionally misconfigured cloud lab for public storage, broad permissions, and missing audit events. Produced a prioritized remediation record and checks that verify each change.
  Stack: IAM · Terraform · CloudTrail
  Link: https://example.com/nadia/breakwater
  Decorative cover: architecture
- **Tracebook / Endpoint evidence workflow** — CASE 003 · INCIDENT RESPONSE
  Reconstructed a simulated endpoint incident from synthetic event logs and disk artifacts. Built a timeline, preserved evidence hashes, and wrote a handoff guide separating observations from assumptions.
  Stack: Sysmon · Velociraptor · Timeline analysis
  Link: https://example.com/nadia/tracebook
  Decorative cover: dashboard

### 4. Skills — A practical defensive toolkit.

Subtitle: Capabilities

Tools support the investigation. Knowing what the data can and cannot show comes first.

Tags: Python · Sigma · YARA · Wireshark · Sysmon · Linux · SQL · Git · Terraform

- **Detection & triage**
  Log normalization, behavioral detections, alert enrichment, and evidence-based prioritization.
- **Incident investigation**
  Endpoint timelines, network artifact review, evidence handling, and readable response playbooks.
- **Cloud & automation**
  Identity reviews, configuration baselines, infrastructure checks, and small scripts that remove repetitive work.

### 5. Experience — Practice, collaboration, progress.

Subtitle: Experience

Illustrative roles and organizations. Use this space for your own responsibilities and contributions.

- **Security Analyst · Alderwatch Labs** — 2025 — Present · Fictional example
  Develop investigation notes, tune lab detections, and pair with engineers on configuration reviews. Turn recurring findings into documented checks and response steps.
- **Security Research Intern · Harborlight Collective** — 2024 — 2025 · Fictional example
  Maintained a sandbox telemetry environment and wrote short research briefs on identity and endpoint detection opportunities.

### 6. Education — Learning that leaves evidence.

Subtitle: Credentials & learning

Example learning records, not claims of professional certification. Add your own qualifications and verification links.

- **Defensive Operations Lab** — Example practical course · 2025
  Investigation notebooks, detection exercises, and response handoffs.
  Link: https://example.com/nadia/learning/defensive-operations
- **Cloud Identity Workshop** — Example workshop · 2025
  Least-privilege reviews and audit-log coverage in a disposable environment.
  Link: https://example.com/nadia/learning/cloud-identity
- **BSc Information Systems · Pinehaven Institute** — Fictional education example · 2020 — 2024
  Networks, operating systems, and secure application fundamentals.

### 7. Writing — Notes from the investigation desk.

Subtitle: Research notes

Short, reproducible explanations for other defenders. These are fictional article placeholders.

- **An alert is a question, not a verdict** — DETECTION NOTES · 2025
  A checklist for testing a detection hypothesis before escalating an event.
  Link: https://example.com/nadia/notes/detection-hypotheses
- **Writing an incident timeline someone else can use** — RESPONSE NOTES · 2025
  How to keep sources, timestamps, and uncertainty visible in an investigation handoff.
  Link: https://example.com/nadia/notes/incident-timelines

### 8. Contact — Let’s strengthen the next line of defense.

Subtitle: Contact

Have a defensive security role, a research collaboration, or an authorized assessment in mind? Share the context and the problem you want to solve.

- **Email**
  Link: mailto:nadia@example.com
- **Code & lab notes**
  Link: https://example.com/nadia/code
- **Professional profile**
  Link: https://example.com/nadia/profile

CTA: [Email Nadia](mailto:nadia@example.com)
