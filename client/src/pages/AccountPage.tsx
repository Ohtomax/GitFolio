import { Check, Github, LogOut } from 'lucide-react';
import { Brand } from '../components/common/Brand.tsx';
import { useLogout } from '../hooks/useAuth.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import { errorMessage } from '../utils/errorParser.ts';

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  if (!user) return null;
  return <div className="min-h-screen"><header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7"><Brand /><button className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-white disabled:opacity-50" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={15} aria-hidden="true" />{logout.isPending ? 'Signing out…' : 'Sign out'}</button></header>
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-14">
      {logout.isError && <p role="alert" className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{errorMessage(logout.error)}</p>}
      <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-200 px-3 py-1.5 text-xs font-semibold text-lime-950"><Check size={14} aria-hidden="true" /> GitHub connected</span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Welcome, {user.name || user.login}.</h1>
      <p className="mt-5 max-w-xl leading-7 text-stone-600">You’re signed in to GitFolio. This is the account you’ll use to build your portfolio.</p>
      <section className="mt-10 rounded-3xl border border-stone-200 bg-white p-7 sm:p-9" aria-label="Connected GitHub account"><div className="flex items-center gap-4">
        {user.avatarUrl ? <img src={user.avatarUrl} width={56} height={56} className="h-14 w-14 rounded-2xl" alt="" referrerPolicy="no-referrer" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100"><Github size={28} aria-hidden="true" /></span>}
        <div><h2 className="text-lg font-semibold">{user.login}</h2><p className="mt-1 text-sm text-stone-500">{user.email || 'GitHub account'}</p></div>
      </div><p className="mt-6 border-t border-stone-100 pt-5 text-sm text-stone-500">Your GitHub profile is connected securely. You can sign out at any time.</p></section>
    </main>
  </div>;
}
