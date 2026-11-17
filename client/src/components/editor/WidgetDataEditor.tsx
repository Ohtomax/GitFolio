import { useState } from 'react';
import { BUILTIN_TEMPLATES, RoleWidgetSchema, type RoleWidget } from '@gitfolio/shared';

export function WidgetDataEditor({ value, disabled, onChange }: { value?: RoleWidget; disabled: boolean; onChange: (widget: RoleWidget) => void }) {
  const original = JSON.stringify(value ?? {},null,2);
  const [draft,setDraft] = useState(original);
  let candidate: RoleWidget | undefined;
  try { const parsed = RoleWidgetSchema.safeParse(JSON.parse(draft) as unknown); if(parsed.success)candidate=parsed.data; } catch { /* Preserve incomplete local input until Apply. */ }
  const presets = BUILTIN_TEMPLATES.flatMap((template) => template.defaultConfig.sections.flatMap((section) => section.content.widget ? [{name:template.name,widget:section.content.widget}] : []));
  return <fieldset disabled={disabled} className="space-y-3 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-xs font-semibold text-stone-600">Interactive demo</legend>
    <p className="text-xs leading-5 text-stone-500">Demo controls use the data below. They run locally and never execute requests, scans, commands, or SQL.</p>
    <label className="block text-xs text-stone-600">Choose demo<select aria-label="Choose demo" className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-2 text-xs" value={value?.kind ?? ''} onChange={(event) => { const preset=presets.find((item) => item.widget.kind===event.target.value);if(preset)onChange(structuredClone(preset.widget)); }}><option value="">Select a demo</option>{presets.map((preset) => <option key={preset.widget.kind} value={preset.widget.kind}>{preset.name}</option>)}</select></label>
    <details><summary className="cursor-pointer py-2 text-xs font-medium">Edit demo data</summary><label className="mt-2 block text-xs text-stone-600">Interactive demo data<textarea rows={16} maxLength={200000} spellCheck={false} value={draft} aria-invalid={!candidate} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-2 font-mono text-[11px] leading-5" onChange={(event) => setDraft(event.target.value)} /></label>
      {!candidate && <p role="status" className="mt-2 text-xs text-red-700">Check the JSON, required fields, unique IDs, and payload format.</p>}
      {draft!==original && <p className="mt-2 text-xs text-amber-800">Apply these demo edits to include them in your saved draft.</p>}
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!candidate || draft===original} className="rounded-lg bg-stone-900 px-3 py-2 text-xs text-white disabled:opacity-40" onClick={() => candidate && onChange(candidate)}>Apply demo data</button><button type="button" className="rounded-lg border border-stone-300 px-3 py-2 text-xs" onClick={() => setDraft(original)}>Reset demo edits</button></div>
    </details>
  </fieldset>;
}
