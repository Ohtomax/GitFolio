import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceShell } from '../common/WorkspaceShell.tsx';

export function EditorFrame({ name, toolbar, navigation, inspector, children, notice, beforeLogout }: {
  name: string; toolbar?: ReactNode; navigation: ReactNode; inspector: ReactNode; children: ReactNode; notice?: ReactNode; beforeLogout?: () => boolean;
}) {
  return <WorkspaceShell beforeLogout={beforeLogout}><div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-8">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
      <div className="min-w-0"><Link to="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-950"><ArrowLeft size={13} aria-hidden="true" />All projects</Link><h1 className="truncate text-2xl font-semibold tracking-tight" title={name}>{name}</h1><p className="mt-1 text-xs text-stone-500">Portfolio editor</p></div>
      <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
    </header>
    {notice}
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_290px]">
      <aside className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4" aria-label="Editor navigation">{navigation}</aside>
      <div className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-200/50" aria-label="Editor canvas">{children}</div>
      <aside className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2 xl:col-span-1" aria-label="Editor properties">{inspector}</aside>
    </div>
  </div></WorkspaceShell>;
}
