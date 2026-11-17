import { useId, useState } from 'react';
import type { FlowWidget } from '../shared/contracts.ts';
import { control, codePanel, DemoNote } from '../shared/RoleFrame.tsx';

function pretty(value: string) {
  try {
    return JSON.stringify(JSON.parse(value) as unknown, null, 2);
  } catch {
    return value;
  }
}

export function ArchitectureFlow({ data, interactive = true }: { data: FlowWidget; interactive?: boolean }) {
  const [activeId, setActiveId] = useState(data.flows[0]?.id ?? '');
  const id = useId();
  const current = data.flows.find((item) => item.id === activeId) ?? data.flows[0];

  if (!current) return <p>No architecture flows configured.</p>;

  return (
    <div className="rp-flow-widget" data-widget="flow">
      <fieldset disabled={!interactive} className="rp-flow-nav">
        <legend className="sr-only">Interactive full-stack flows</legend>
        <p className="rp-kicker">USER INTENT / ACTION</p>
        <div className="space-y-2">
          {data.flows.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={item.id === current.id}
              className={`${control} w-full text-left`}
              onClick={() => setActiveId(item.id)}
            >
              <span className="block font-semibold">{item.label}</span>
              <span className="mt-1 block font-mono text-[10px] text-[var(--rp-accent)]">{item.route}</span>
            </button>
          ))}
        </div>
        <DemoNote>Select action to trace full lifecycle</DemoNote>
      </fieldset>

      <div className="min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rp-border)] pb-4">
          <div>
            <span className="rp-tag">FULL-STACK TRACE</span>
            <h3 className="mt-2 font-mono text-sm">
              <span className="text-[var(--rp-accent)]">{current.route.split(' ')[0]}</span>{' '}
              {current.route.split(' ').slice(1).join(' ')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[var(--rp-accent)] px-2 py-1 font-mono text-xs text-[var(--rp-accent)]">
              p95: {current.latency}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-6 text-[var(--rp-muted)]">{current.explanation}</p>

        <div className="mt-5 space-y-4" id={id} aria-live="polite" aria-atomic="true">
          <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-surface)] p-3">
            <p className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--rp-accent)]">
              <span>01. HTTP Boundary / Handler</span>
              <span className="text-[var(--rp-muted)]">{current.latency}</span>
            </p>
            <pre className={codePanel}>
              <code>{current.route}</code>
            </pre>
          </div>

          <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-surface)] p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--rp-primary)]">
              02. PostgreSQL Transaction / ACID Query
            </p>
            <pre className={codePanel}>
              <code>{current.query}</code>
            </pre>
          </div>

          <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-surface)] p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--rp-success)]">
              03. Client Response / Payload
            </p>
            <pre className={codePanel}>
              <code>{pretty(current.result)}</code>
            </pre>
          </div>
        </div>

        <DemoNote>Illustrative database trace · Parameterized queries · No live execution</DemoNote>
      </div>
    </div>
  );
}
