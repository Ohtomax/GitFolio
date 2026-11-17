import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSkeleton } from '../common/PageSkeleton.tsx';
import { useAuthSession } from '../../hooks/useAuth.ts';
import { useAuthStore } from '../../stores/auth.store.ts';
import { errorMessage } from '../../utils/errorParser.ts';

export function AuthGuard({ children }: { children?: ReactNode }) {
  const session = useAuthSession();
  const status = useAuthStore((state) => state.status);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const location = useLocation();
  if (status === 'checking') return <PageSkeleton />;
  if (status === 'unavailable') return <main className="mx-auto max-w-xl px-6 py-24" role="alert">
    <h1 className="text-2xl font-semibold">We couldn’t check your session.</h1>
    <p className="my-4 text-stone-600">{errorMessage(session.error)}</p>
    <button className="primary-button" disabled={session.isFetching} onClick={() => void session.refetch()}>Try again</button>
  </main>;
  if (status !== 'authenticated' || !expiresAt || expiresAt <= Date.now()) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children ?? <Outlet />;
}
