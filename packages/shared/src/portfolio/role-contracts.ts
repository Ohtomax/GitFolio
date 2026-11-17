// Portable contracts are also included in standalone React exports.
export const ROLE_LAYOUTS = ['backend', 'security', 'quality', 'frontend', 'fullstack'] as const;
export type RoleLayout = typeof ROLE_LAYOUTS[number];
export const isRoleLayout = (layout?: string): layout is RoleLayout => ROLE_LAYOUTS.some((role) => role === layout);
export type RoleMetric = { value: string; label: string }
export type ApiExample = { id: string; label: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; request: string; response: string; p99: string; throughput: string; status: number }
export type ApiWidget = { kind: 'api'; endpoints: ApiExample[] }
export type SecurityFinding = { id: string; title: string; severity: 'Critical' | 'High' | 'Medium'; target: string; status: 'Patched' | 'Mitigated' | 'In review'; summary: string; resolution: string; reference?: string }
export type SecurityWidget = { kind: 'security'; findings: SecurityFinding[] }
export type TokenWidget = { kind: 'tokens'; title: string; description: string; buttonLabel: string }
export type SandboxWidget = { kind: 'sandbox'; title: string; description: string; buttonLabel: string }
export type FlowExample = { id: string; label: string; route: string; query: string; result: string; latency: string; explanation: string }
export type FlowWidget = { kind: 'flow'; flows: FlowExample[] }
export type RoleWidget = ApiWidget | SecurityWidget | TokenWidget | SandboxWidget | FlowWidget;
export type RoleItem = { title: string; subtitle?: string; description?: string; url?: string; tags?: string[]; visual?: string; metrics?: RoleMetric[]; embedUrl?: string; embedLabel?: string }
export interface RoleSection {
  id: string; type: string; visible: boolean; sortOrder?: number;
  content: { heading: string; description: string; eyebrow?: string; subtitle?: string; buttonLabel?: string; buttonUrl?: string; tags?: string[]; metrics?: RoleMetric[]; items?: RoleItem[]; widget?: RoleWidget };
}
export interface RoleDocument {
  name?: string;
  themeConfig: { layout?: string; demo?: boolean; font: 'sans' | 'serif' | 'mono'; headingFont?: 'sans' | 'serif' | 'mono'; spacing: 'compact' | 'comfortable' | 'spacious';
    colors: { background: string; text: string; accent: string; muted?: string; surface?: string; border?: string; primary?: string; success?: string; warning?: string; danger?: string } };
  sections: RoleSection[];
}
export interface RolePortfolioProps { document: RoleDocument; interactive?: boolean; thumbnail?: boolean; selectedId?: string | null; onSelect?: (id: string) => void }
