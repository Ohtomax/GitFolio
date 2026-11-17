import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/common/Brand.tsx';
import { PageSkeleton } from '../components/common/PageSkeleton.tsx';
import { useCompleteOAuth } from '../hooks/useAuth.ts';
import { parseOAuthCallback, RETURN_TO_KEY, safeReturnTo } from '../utils/auth-navigation.ts';
import { errorMessage } from '../utils/errorParser.ts';

export default function OAuthCallbackPage() {
  const [callback] = useState(() => parseOAuthCallback(window.location.search));
  const started = useRef(false);
  const navigate = useNavigate();
  const { mutate, error } = useCompleteOAuth();
  useEffect(() => {
    // Remove OAuth codes from history before doing anything else or navigating away.
    window.history.replaceState(window.history.state, '', '/auth/callback');
    if (!callback.input || started.current) return;
    started.current = true;
    mutate(callback.input, { onSuccess: () => {
      let returnTo = '/account';
      try { returnTo = safeReturnTo(window.sessionStorage.getItem(RETURN_TO_KEY)); window.sessionStorage.removeItem(RETURN_TO_KEY); } catch { /* Use the default destination. */ }
      navigate(returnTo, { replace: true });
    } });
  }, [callback, mutate, navigate]);
  const message = callback.error ?? (error ? errorMessage(error) : null);
  if (!message) return <PageSkeleton label="Finishing GitHub sign-in" />;
  return <main className="mx-auto max-w-xl px-6 py-16"><Brand /><div className="mt-12 rounded-3xl border border-stone-200 bg-white p-8" role="alert">
    <h1 className="text-2xl font-semibold tracking-tight">Let’s try that again.</h1><p className="my-5 leading-7 text-stone-600">{message}</p>
    <Link to="/login" replace className="primary-button inline-block">Back to sign in</Link>
  </div></main>;
}
