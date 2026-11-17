import { z } from 'zod';
import type { RoleWidget } from '../portfolio/role-contracts.js';

const id = z.string().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/);
const short = z.string().max(120);
const json = z.string().max(8000).refine((value) => { try { const parsed: unknown = JSON.parse(value); return parsed !== null && typeof parsed === 'object'; } catch { return false; } }, 'Enter a JSON object or array.');
const distinct = <T extends { id: string }>(items: T[]) => new Set(items.map((item) => item.id)).size === items.length;
export const RoleWidgetSchema: z.ZodType<RoleWidget> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('api'), endpoints: z.array(z.object({ id, label: short, method: z.enum(['GET','POST','PUT','DELETE']), path: z.string().max(200).regex(/^\/[A-Za-z0-9_/?=&.{}:-]*$/), request: json, response: json, p99: z.string().max(40), throughput: z.string().max(60), status: z.number().int().min(100).max(599) }).strict()).min(1).max(6).refine(distinct, 'Use unique endpoint IDs.') }).strict(),
  z.object({ kind: z.literal('security'), findings: z.array(z.object({ id, title: short, severity: z.enum(['Critical','High','Medium']), target: short, status: z.enum(['Patched','Mitigated','In review']), summary: z.string().max(2000), resolution: z.string().max(2000), reference: z.string().url().max(2048).refine((value) => { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }, 'Use a public HTTPS advisory link.').optional() }).strict()).min(1).max(30).refine(distinct, 'Use unique finding IDs.') }).strict(),
  z.object({ kind: z.literal('tokens'), title: short, description: z.string().max(1000), buttonLabel: z.string().max(80) }).strict(),
  z.object({ kind: z.literal('sandbox'), title: short, description: z.string().max(1000), buttonLabel: z.string().max(80) }).strict(),
  z.object({ kind: z.literal('flow'), flows: z.array(z.object({ id, label: short, route: z.string().max(200), query: z.string().max(4000), result: z.string().max(1000), latency: z.string().max(40), explanation: z.string().max(1000) }).strict()).min(1).max(6).refine(distinct, 'Use unique flow IDs.') }).strict(),
]);
