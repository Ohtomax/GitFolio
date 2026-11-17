import { ArrowRight, ArrowUpRight, Check, Github, Globe2, LockKeyhole } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Brand } from '../components/common/Brand.tsx';
import { useAuthSession } from '../hooks/useAuth.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import { RETURN_TO_KEY, safeReturnTo } from '../utils/auth-navigation.ts';
import { errorMessage } from '../utils/errorParser.ts';

export default function LoginPage() {
  const session = useAuthSession();
  const status = useAuthStore((state) => state.status);
  const location = useLocation();
  const from: unknown = typeof location.state === 'object' && location.state !== null && 'from' in location.state
    ? location.state.from : undefined;
  const returnTo = safeReturnTo(from);
  if (status === 'authenticated') return <Navigate to={returnTo} replace />;
  function signIn() {
    try { window.sessionStorage.setItem(RETURN_TO_KEY, returnTo); } catch { /* Sign-in works without browser storage. */ }
    window.location.assign('/api/auth/github');
  }
  return <div className="min-h-screen bg-[#f7f8f2] text-stone-900">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10">
      <Brand />
      <a className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-950" href="https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps" target="_blank" rel="noopener noreferrer">
        About GitHub sign-in <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </header>
    <main className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-7 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pb-20 lg:pt-14">
      <section className="flex flex-col justify-center">
        <span className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-600" /> Your next chapter, online
        </span>
        <h1 className="max-w-xl text-5xl font-semibold leading-[1.07] tracking-[-0.055em] sm:text-7xl lg:text-[78px]">Good work<br />deserves a<br /><span className="relative inline-block">great home<span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-lime-300/70" aria-hidden="true" /></span>.</h1>
        <p className="mt-7 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">Turn what you’ve built into a portfolio that feels like you. Start with your GitHub account.</p>
        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-600">
          {['Your work, your space', 'Made for GitHub Pages'].map((text) => <span key={text} className="inline-flex items-center gap-2"><Check size={16} className="text-lime-700" aria-hidden="true" />{text}</span>)}
        </div>
        <div className="mt-12 hidden max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:block" aria-label="Example portfolio preview">
          <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-3 text-[10px] font-medium uppercase tracking-widest text-stone-400"><span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-stone-200" /><span className="h-2 w-2 rounded-full bg-stone-200" /><span className="h-2 w-2 rounded-full bg-stone-200" /></span><span>What’s next · Your portfolio</span><Globe2 size={13} aria-hidden="true" /></div>
          <div className="flex items-center justify-between"><div><p className="text-xs text-stone-500">Hello, world.</p><p className="mt-1 text-xl font-semibold tracking-tight">A little corner of the internet.<span className="text-lime-600"> ↗</span></p><p className="mt-2 text-xs text-stone-500">Your projects. Your story. Your name on it.</p></div><div className="ml-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-lime-200 font-mono text-xl text-lime-900">&lt;/&gt;</div></div>
        </div>
      </section>
      <section className="flex items-center lg:py-7">
        <div className="w-full rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_16px_60px_-32px_rgba(28,25,23,0.18)] sm:p-10">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100"><Github size={26} aria-hidden="true" /></div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">A fresh start</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Let’s make it yours.</h2>
          <p className="mt-4 text-sm leading-6 text-stone-500">Sign in to your GitFolio workspace. No new password to remember.</p>
          {session.isError && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
            <p>{errorMessage(session.error)}</p><button className="mt-2 font-semibold underline underline-offset-4 disabled:opacity-50" disabled={session.isFetching} onClick={() => void session.refetch()}>Try again</button>
          </div>}
          <button className="primary-button mt-8 flex w-full items-center justify-between py-4" onClick={signIn} disabled={status === 'checking' || session.isError}>
            <span className="flex items-center gap-3"><Github size={19} aria-hidden="true" />{status === 'checking' ? 'Checking your session…' : 'Continue with GitHub'}</span><ArrowRight size={18} aria-hidden="true" />
          </button>
          <div className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-stone-500"><LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><p>Only your GitHub profile and email are requested. Your GitHub password stays with GitHub.</p></div>
          <div className="my-8 h-px bg-stone-100" />
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-400">From first commit to first impression</p>
          <ol className="mt-5 space-y-4">
            {['Connect your GitHub account', 'Build a portfolio around your work', 'Give it a home on GitHub Pages'].map((text, index) => <li key={text} className="flex items-center gap-3 text-sm text-stone-600"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${index === 0 ? 'bg-lime-200 text-lime-900' : 'bg-stone-100 text-stone-400'}`}>0{index + 1}</span>{text}</li>)}
          </ol>
        </div>
      </section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-stone-200 px-6 py-6 text-xs text-stone-500 sm:px-10"><span>GitFolio · A place for your progress.</span><span>Built for the things you build.</span></footer>
  </div>;
}
