import type { TemplateCategory, TemplateSummary } from '@gitfolio/shared';

const palettes: Record<TemplateCategory, { surface: string; text: string; accent: string; card: string; font: string }> = {
  minimal: { surface: 'bg-stone-50', text: 'text-stone-900', accent: 'bg-lime-500', card: 'bg-stone-200/70', font: 'font-sans' },
  developer: { surface: 'bg-stone-900', text: 'text-stone-100', accent: 'bg-lime-400', card: 'bg-stone-700', font: 'font-mono' },
  professional: { surface: 'bg-amber-50', text: 'text-stone-800', accent: 'bg-amber-700', card: 'bg-amber-200/70', font: 'font-serif' },
  creative: { surface: 'bg-violet-50', text: 'text-violet-950', accent: 'bg-violet-500', card: 'bg-violet-200/70', font: 'font-sans' },
};
export function TemplatePreview({ template }: { template: TemplateSummary }) {
  const palette = palettes[template.category];
  return <div aria-hidden="true" className={`aspect-[16/10] overflow-hidden p-6 sm:p-7 ${palette.surface} ${palette.text} ${palette.font}`}>
    <div className="mb-6 flex items-center justify-between text-[8px] uppercase tracking-[0.15em]"><span className="font-semibold">Your name.</span><span className="opacity-50">Work &nbsp; About &nbsp; Contact</span></div>
    <div className="flex items-center justify-between gap-3"><div><p className="text-[8px] uppercase tracking-[0.2em] opacity-50">Hello, world</p><p className="mt-2 text-xl font-semibold leading-tight tracking-tight">Building things<br />that matter.</p><div className={`mt-3 h-1 w-10 rounded-full ${palette.accent}`} /></div><div className={`h-14 w-14 shrink-0 rounded-2xl ${palette.accent} ${template.category === 'creative' ? 'rotate-12' : ''}`} /></div>
    <div className="mt-5 grid grid-cols-3 gap-2">{[0, 1, 2].map((item) => <div key={item} className={`h-8 rounded-md ${palette.card}`} />)}</div>
  </div>;
}
