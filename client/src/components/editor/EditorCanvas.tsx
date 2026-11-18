import { useDeferredValue, useState } from 'react';
import { useEditor } from './EditorProvider.tsx';
import { PortfolioPreview } from './PortfolioPreview.tsx';
import { PreviewErrorBoundary } from '../common/PreviewErrorBoundary.tsx';

const sizes = { desktop: 'max-w-full', tablet: 'max-w-[768px]', mobile: 'max-w-[375px]' };
export function EditorCanvas({ archived }: { archived: boolean }) {
  const document = useEditor((state) => state.document);
  const selectedId = useEditor((state) => state.selectedId);
  const selectSection = useEditor((state) => state.selectSection);
  const deferred = useDeferredValue(document);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<keyof typeof sizes>('desktop');
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 text-xs text-stone-500">
      <div className="flex gap-1" role="group" aria-label="Canvas mode">{[{ value: false, label: 'Canvas' }, { value: true, label: 'Preview' }].map(({ value, label }) => <button key={label} type="button" aria-pressed={preview === value}
        onClick={() => setPreview(value)} className={`rounded-lg px-3 py-2 font-medium ${preview === value ? 'bg-stone-950 text-white' : 'hover:bg-stone-100'}`}>{label}</button>)}</div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Preview width">{(['desktop', 'tablet', 'mobile'] as const).map((value) => <button key={value} type="button" aria-label={`${value} preview width`} aria-pressed={device === value}
        onClick={() => setDevice(value)} className={`rounded-lg px-2 py-2 capitalize ${device === value ? 'bg-stone-100 text-stone-950' : 'hover:bg-stone-50'}`}>{value}</button>)}</div>
    </div>
    {archived && <p role="status" className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This project is archived. Restore it from your projects to make changes.</p>}
    <p className="px-4 pt-3 text-[11px] text-stone-500">{preview ? 'Preview links open in a new tab.' : 'Select a section to edit its content.'} {document.sections.filter((section) => section.visible).length} visible sections.</p>
    <div className="p-3 sm:p-5"><div data-testid="preview-viewport" className={`mx-auto w-full overflow-hidden rounded-xl ${sizes[device]}`}>
      <PreviewErrorBoundary resetKey={deferred.themeConfig.layout}><PortfolioPreview document={deferred} selectedId={selectedId} onSelect={preview ? undefined : selectSection} interactive={preview} /></PreviewErrorBoundary>
    </div></div>
  </>;
}
