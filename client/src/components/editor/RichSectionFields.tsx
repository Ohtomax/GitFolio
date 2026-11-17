import { ProjectVisualSchema, type EditorSection, type EditorItem, type SectionContent } from '@gitfolio/shared';

const input = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm disabled:opacity-50';
const tagValues = (value: string) => value.split('\n').slice(0, 12).map((tag) => tag.slice(0, 40));
export function RichSectionFields({ section, disabled, onChange }: { section: EditorSection; disabled: boolean; onChange: (content: Partial<SectionContent>) => void }) {
  const metrics = section.content.metrics ?? [];
  return <><label className="block text-xs text-stone-600">Tags (one per line, up to 12)<textarea rows={3} className={input} value={(section.content.tags ?? []).join('\n')} disabled={disabled} onChange={(event) => onChange({ tags: tagValues(event.target.value) })} /></label>
    {section.type === 'hero' && <fieldset className="space-y-3 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-xs font-semibold text-stone-600">Impact metrics · {metrics.length}/4</legend>
      {metrics.map((metric, index) => <div className="space-y-2 border-b border-stone-100 pb-3" key={index}>{(['value', 'label'] as const).map((key) => <label key={key} className="block text-xs text-stone-500">Metric {index + 1} {key}<input className={input} value={metric[key]} disabled={disabled} maxLength={key === 'value' ? 24 : 80} onChange={(event) => onChange({ metrics: metrics.map((entry, i) => i === index ? { ...entry, [key]: event.target.value } : entry) })} /></label>)}<button type="button" className="text-xs text-red-700" disabled={disabled} onClick={() => onChange({ metrics: metrics.filter((_, i) => i !== index) })}>Remove metric {index + 1}</button></div>)}
      <button type="button" className="rounded border border-stone-300 px-3 py-2 text-xs disabled:opacity-40" disabled={disabled || metrics.length >= 4} onClick={() => onChange({ metrics: [...metrics, { value: '', label: '' }] })}>Add metric</button>
    </fieldset>}
  </>;
}
export function EntryPresentationFields({ item, index, disabled, onChange }: { item: EditorItem; index: number; disabled: boolean; onChange: (item: Partial<EditorItem>) => void }) {
  return <><label className="block text-xs text-stone-500">Entry {index + 1} cover graphic<select className={input} value={item.visual ?? ''} disabled={disabled} onChange={(event) => onChange({ visual: event.target.value ? ProjectVisualSchema.parse(event.target.value) : undefined })}><option value="">None</option>{ProjectVisualSchema.options.map((visual) => <option value={visual} key={visual}>{visual}</option>)}</select></label>
    <label className="block text-xs text-stone-500">Entry {index + 1} tags (one per line)<textarea rows={2} className={input} value={(item.tags ?? []).join('\n')} disabled={disabled} onChange={(event) => onChange({ tags: tagValues(event.target.value) })} /></label></>;
}
