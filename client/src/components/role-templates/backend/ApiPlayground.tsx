import { useId, useState } from 'react';
import type { ApiWidget } from '../shared/contracts.ts';
import { control, codePanel, DemoNote, Metrics } from '../shared/RoleFrame.tsx';

function pretty(value: string) { try { return JSON.stringify(JSON.parse(value) as unknown,null,2); } catch { return 'This sample needs valid JSON.'; } }
export function ApiPlayground({ data, interactive = true }: { data: ApiWidget; interactive?: boolean }) {
  const [endpointId,setEndpointId] = useState(data.endpoints[0]?.id ?? '');
  const [view,setView] = useState<'request'|'response'>('request');
  const id = useId(), endpoint = data.endpoints.find((item) => item.id===endpointId) ?? data.endpoints[0];
  if(!endpoint)return <p>No API examples configured.</p>;
  return <div className="rp-api-playground" data-widget="api">
    <fieldset disabled={!interactive} className="rp-api-endpoints"><legend className="sr-only">Example endpoints</legend><p className="rp-kicker">API CONTRACTS / v1</p>{data.endpoints.map((item) => <button type="button" key={item.id} aria-pressed={item.id===endpoint.id} className={`${control} text-left`} onClick={() => setEndpointId(item.id)}><span className="block font-mono text-[10px]">{item.method} {item.path}</span><span className="mt-1 block">{item.label}</span></button>)}<DemoNote>Sample requests · No network calls</DemoNote></fieldset>
    <div className="min-w-0 p-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rp-border)] pb-4"><h3 className="font-mono text-sm"><span className="text-[var(--rp-accent)]">{endpoint.method}</span> {endpoint.path}</h3><span className="rounded border border-[var(--rp-success)] px-2 py-1 font-mono text-xs text-[var(--rp-success)]">HTTP {endpoint.status}</span></div>
      <fieldset disabled={!interactive} className="my-4 flex flex-wrap gap-2"><legend className="sr-only">Payload view</legend>{(['request','response'] as const).map((tab) => <button type="button" key={tab} className={control} aria-pressed={view===tab} aria-controls={id} onClick={() => setView(tab)}>{tab==='request'?'Request JSON':'Response JSON'}</button>)}</fieldset>
      <div id={id} aria-live="polite" aria-atomic="true"><p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--rp-muted)]">{endpoint.label} / {view}</p><pre className={codePanel}><code>{pretty(endpoint[view])}</code></pre></div>
      <Metrics compact items={[{value:endpoint.p99,label:'Example p99 latency'},{value:endpoint.throughput,label:'Fixture benchmark'},{value:String(endpoint.status),label:'Response contract'}]} />
      <DemoNote>Illustrative benchmark · 8 vCPU test fixture · 10-minute sample · Not a live measurement</DemoNote>
    </div>
  </div>;
}
