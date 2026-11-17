import type { ReactNode } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Brand } from './Brand.tsx';
import { useLogout } from '../../hooks/useAuth.ts';
import { errorMessage } from '../../utils/errorParser.ts';

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const logout = useLogout();
  const navClass = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-950'}`;
  return <div className="min-h-screen bg-[#f7f8f2]">
    <header className="border-b border-stone-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10">
        <Brand />
        <nav className="flex items-center gap-1" aria-label="Workspace navigation">
          <NavLink to="/dashboard" className={navClass}>Projects</NavLink>
          <NavLink to="/account" className={navClass}><span className="inline-flex items-center gap-1.5"><UserRound size={14} aria-hidden="true" /><span className="hidden sm:inline">Account</span><span className="sr-only sm:hidden">Account</span></span></NavLink>
          <button type="button" aria-label="Sign out" className="ml-1 rounded-lg p-2.5 text-stone-500 hover:bg-white hover:text-stone-950 disabled:opacity-50" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={16} aria-hidden="true" /></button>
        </nav>
      </div>
    </header>
    {logout.isError && <p role="alert" className="mx-auto mt-5 max-w-5xl rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{errorMessage(logout.error)}</p>}
    {children}
  </div>;
}
