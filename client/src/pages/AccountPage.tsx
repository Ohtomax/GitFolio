import { Check, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { useAuthStore } from '../stores/auth.store.ts';

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  return <WorkspaceShell>
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-14">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-200 px-3 py-1.5 text-xs font-semibold text-lime-950"><Check size={14} aria-hidden="true" /> GitHub connected</span>
      <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">Welcome, {user.name || user.login}.</h1>
      <p className="mt-5 max-w-xl leading-7 text-stone-600">You’re signed in to GitFolio. This is the account you’ll use to build your portfolio.</p>
      <Link to="/dashboard" className="primary-button mt-6 inline-block">Open your projects</Link>
      <section className="mt-10 rounded-3xl border border-stone-200 bg-white p-7 sm:p-9" aria-label="Connected GitHub account"><div className="flex items-center gap-4">
        {user.avatarUrl ? <img src={user.avatarUrl} width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl" alt="" referrerPolicy="no-referrer" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-stone-100"><Github size={28} aria-hidden="true" /></span>}
        <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{user.login}</h2><p className="mt-1 break-all text-sm text-stone-500">{user.email || 'GitHub account'}</p></div>
      </div><p className="mt-6 border-t border-stone-100 pt-5 text-sm text-stone-500">Your GitHub profile is connected securely. You can sign out at any time.</p></section>
    </main>
  </WorkspaceShell>;
}
