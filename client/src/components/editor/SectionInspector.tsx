import { PortfolioUrlSchema, PortfolioImageUrlSchema, SectionTypeSchema, isRoleLayout, type EditorItem, type SectionContent } from '@gitfolio/shared';
import { useEditor, useEditorApi } from './EditorProvider.tsx';
import { RichSectionFields, EntryPresentationFields } from './RichSectionFields.tsx';
import { WidgetDataEditor } from './WidgetDataEditor.tsx';
import { sectionNames } from './SectionNavigation.tsx';

const inputClass = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm disabled:opacity-50';
export function SectionInspector({ disabled }: { disabled: boolean }) {
  const store = useEditorApi();
  const document = useEditor((state) => state.document);
  const selectedId = useEditor((state) => state.selectedId);
  const selected = document.sections.find((section) => section.id === selectedId);
  if (!selected) return <><h2 className="text-sm font-semibold">Section details</h2><p className="mt-3 text-sm text-stone-500">Add a section to start building your portfolio.</p></>;
  function content(update: Partial<SectionContent>, group?: string) {
    if (disabled) return;
    const state = store.getState();
    state.setDocument({ ...state.document, sections: state.document.sections.map((section) => section.id === selectedId
      ? { ...section, content: { ...section.content, ...update } } : section) }, group);
  }
  function field(key: 'heading' | 'description' | 'eyebrow' | 'subtitle' | 'buttonLabel' | 'buttonUrl' | 'portraitUrl' | 'portraitAlt', label: string, maxLength: number, multiline = false) {
    const value = selected?.content[key] ?? '';
    const invalid = key === 'buttonUrl' ? !PortfolioUrlSchema.safeParse(value).success
      : key === 'portraitUrl' && !PortfolioImageUrlSchema.safeParse(value).success;
    const errorId = `section-${selectedId}-${key}-error`;
    return <label className="block text-xs font-medium text-stone-600" key={key}>{label}{multiline
      ? <textarea aria-label={label} value={value} rows={key === 'heading' ? 2 : 5} maxLength={maxLength} disabled={disabled} className={inputClass} onChange={(event) => content({ [key]: event.target.value }, `${selectedId}:${key}`)} onBlur={() => store.getState().endGroup()} />
      : <input aria-label={label} value={value} maxLength={maxLength} disabled={disabled} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} className={inputClass} onChange={(event) => content({ [key]: event.target.value }, `${selectedId}:${key}`)} onBlur={() => store.getState().endGroup()} />}{invalid && <span id={errorId} className="mt-1 block text-red-700">{key === 'portraitUrl' ? 'Use an http:// or https:// image link.' : 'Use an http://, https://, or mailto: link.'}</span>}</label>;
  }
  const listSection = ['projects', 'skills', 'experience', 'education', 'writing', 'now', 'contact'].includes(selected.type);
  const items = selected.content.items ?? [];
  function updateItem(index: number, key: keyof EditorItem, value: string) {
    content({ items: items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }, `${selectedId}:item:${index}:${key}`);
  }
  return <><h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-stone-500">Section details</h2><div className="space-y-5">
    <label className="block text-xs font-medium text-stone-600">Section type<select value={selected.type} disabled={disabled} className={inputClass} onChange={(event) => {
      const state = store.getState(); state.setDocument({ ...state.document, sections: state.document.sections.map((section) => section.id === selectedId ? { ...section, type: SectionTypeSchema.parse(event.target.value) } : section) });
    }}>{SectionTypeSchema.options.map((type) => <option key={type} value={type}>{sectionNames[type]}</option>)}</select></label>
    <label className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" checked={selected.visible} disabled={disabled} onChange={(event) => { const state = store.getState(); state.setDocument({ ...state.document, sections: state.document.sections.map((section) => section.id === selectedId ? { ...section, visible: event.target.checked } : section) }); }} />Visible in portfolio</label>
    {field('heading', 'Section heading', 120, ['monochrome', 'dossier', 'kinetic'].includes(document.themeConfig.layout ?? ''))}{field('description', 'Section description', 5000, true)}
    {field('subtitle', 'Subtitle / role', 180)}{selected.type === 'hero' && field('eyebrow', 'Eyebrow', 100)}
    {selected.type === 'hero' && ['monochrome', 'kinetic'].includes(document.themeConfig.layout ?? '') && <fieldset className="space-y-3 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-xs font-semibold text-stone-600">Profile portrait</legend>
      {field('portraitUrl', 'Portrait image URL', 2048)}{field('portraitAlt', 'Portrait description', 160)}
      <p className="text-xs leading-5 text-stone-500">Use a publicly accessible image link. Leave it empty to show your initials.</p>
    </fieldset>}
    <RichSectionFields section={selected} disabled={disabled} onChange={content} />
    {selected.type === 'interactive' && <WidgetDataEditor key={`${selected.id}:${JSON.stringify(selected.content.widget)}`} value={selected.content.widget} layout={document.themeConfig.layout} disabled={disabled} onChange={(widget) => content({ widget })} />}
    {['hero', 'contact'].includes(selected.type) && <>{field('buttonLabel', 'Button label', 80)}{field('buttonUrl', 'Button link', 2048)}</>}
    {listSection && <div className="space-y-4 border-t border-stone-200 pt-5"><h3 className="text-xs font-semibold">Entries · {items.length}/20</h3>{items.map((item, index) => <fieldset key={index} className="space-y-3 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-xs text-stone-500">Entry {index + 1}</legend>{([{ key: 'title', label: 'Title', max: 120 }, { key: 'subtitle', label: 'Subtitle', max: 160 }, { key: 'description', label: 'Description', max: 2000 }, { key: 'url', label: 'Link', max: 2048 }] as const).map(({ key, label, max }) => <label key={key} className="block text-xs text-stone-500">{`Entry ${index + 1} ${label.toLowerCase()}`}<input className={inputClass} value={item[key] ?? ''} maxLength={max} disabled={disabled} aria-invalid={key === 'url' && !PortfolioUrlSchema.safeParse(item.url ?? '').success} onChange={(event) => updateItem(index, key, event.target.value)} onBlur={() => store.getState().endGroup()} />{key === 'url' && !PortfolioUrlSchema.safeParse(item.url ?? '').success && <span className="mt-1 block text-red-700">Use an http://, https://, or mailto: link.</span>}</label>)}<EntryPresentationFields role={isRoleLayout(document.themeConfig.layout)} embeds={document.themeConfig.layout==='quality'} item={item} index={index} disabled={disabled} onChange={(changes) => content({ items: items.map((entry, i) => i === index ? { ...entry, ...changes } : entry) })} /><button type="button" className="text-xs font-medium text-red-700 disabled:opacity-40" disabled={disabled} onClick={() => content({ items: items.filter((_item, itemIndex) => itemIndex !== index) })}>Remove entry {index + 1}</button></fieldset>)}<button type="button" className="rounded-lg border border-stone-300 px-3 py-2 text-xs disabled:opacity-40" disabled={disabled || items.length >= 20} onClick={() => content({ items: [...items, { title: '', description: '' }] })}>Add entry</button></div>}
    <div className="border-t border-stone-200 pt-5"><button type="button" className="text-xs font-semibold text-red-700 disabled:opacity-40" disabled={disabled} onClick={() => { const state = store.getState(); state.setDocument({ ...state.document, sections: state.document.sections.filter((section) => section.id !== selectedId) }); }}>Remove section</button><p className="mt-2 text-[11px] leading-5 text-stone-400">Undo restores removed sections while the editor is open.</p></div>
  </div></>;
}
