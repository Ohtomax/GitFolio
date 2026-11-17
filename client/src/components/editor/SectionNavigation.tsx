import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus } from 'lucide-react';
import { SectionTypeSchema, type Project } from '@gitfolio/shared';
import { useEditor, useEditorApi } from './EditorProvider.tsx';

export const sectionNames = { hero: 'Hero', about: 'About', projects: 'Projects', skills: 'Skills', experience: 'Experience', education: 'Education', contact: 'Contact', writing: 'Writing', now: 'Now' } as const;
export function SectionNavigation({ disabled }: { disabled: boolean }) {
  const store = useEditorApi();
  const sections = useEditor((state) => state.document.sections);
  const selectedId = useEditor((state) => state.selectedId);
  const panel = useEditor((state) => state.panel);
  const [type, setType] = useState<(typeof SectionTypeSchema.options)[number]>('about');
  function add() {
    const state = store.getState();
    if (disabled || state.document.sections.length >= 50) return;
    const section: Project['sections'][number] = { id: crypto.randomUUID(), type, sortOrder: state.document.sections.length,
      visible: true, content: { heading: sectionNames[type], description: '' } };
    state.setDocument({ ...state.document, sections: [...state.document.sections, section] });
    store.getState().selectSection(section.id);
  }
  function move(id: string, direction: number) {
    const state = store.getState(), next = [...state.document.sections];
    const index = next.findIndex((section) => section.id === id), target = index + direction;
    if (disabled || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    state.setDocument({ ...state.document, sections: next });
  }
  return <><div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">{(['sections', 'theme'] as const).map((tab) => <button type="button" key={tab} aria-pressed={panel === tab} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${panel === tab ? 'bg-white shadow-sm' : 'text-stone-500'}`} onClick={() => store.getState().setPanel(tab)}>{tab}</button>)}</div>
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">Sections · {sections.length}/50</h2>
    <ol className="max-h-[420px] space-y-2 overflow-y-auto">{sections.map((section, index) => <li key={section.id} className={`rounded-xl border ${selectedId === section.id ? 'border-lime-600 bg-lime-50' : 'border-stone-200'}`}>
      <button type="button" className="flex w-full items-center justify-between gap-2 px-3 pb-2 pt-3 text-left text-sm font-medium" aria-pressed={selectedId === section.id && panel === 'sections'} aria-label={`Edit ${sectionNames[section.type]} section ${index + 1}`} onClick={() => store.getState().selectSection(section.id)}><span className="truncate">{section.content.heading || sectionNames[section.type]}</span>{section.visible ? <Eye size={12} className="shrink-0 text-stone-400" /> : <EyeOff size={12} className="shrink-0 text-stone-400" />}</button>
      <div className="flex items-center justify-between px-3 pb-2"><span className="text-[10px] text-stone-400">{sectionNames[section.type]}</span><div className="flex gap-1"><button type="button" aria-label={`Move section ${index + 1} up`} disabled={disabled || index === 0} className="rounded p-1 hover:bg-white disabled:opacity-25" onClick={() => move(section.id, -1)}><ArrowUp size={12} /></button><button type="button" aria-label={`Move section ${index + 1} down`} disabled={disabled || index === sections.length - 1} className="rounded p-1 hover:bg-white disabled:opacity-25" onClick={() => move(section.id, 1)}><ArrowDown size={12} /></button></div></div>
    </li>)}</ol>
    <div className="mt-5 border-t border-stone-200 pt-4"><label htmlFor="section-type-to-add" className="mb-2 block text-xs text-stone-500">Add a section</label><select id="section-type-to-add" value={type} disabled={disabled || sections.length >= 50} onChange={(event) => setType(SectionTypeSchema.parse(event.target.value))} className="w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm">{SectionTypeSchema.options.map((value) => <option key={value} value={value}>{sectionNames[value]}</option>)}</select><button type="button" className="primary-button mt-3 inline-flex w-full items-center justify-center gap-2" disabled={disabled || sections.length >= 50} onClick={add}><Plus size={14} />Add section</button></div>
  </>;
}
