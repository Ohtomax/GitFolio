import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary.tsx';
import { PageSkeleton } from './components/common/PageSkeleton.tsx';
import { AuthGuard } from './components/auth/AuthGuard.tsx';

const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage.tsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const NewProjectPage = lazy(() => import('./pages/NewProjectPage.tsx'));
const EditorPage = lazy(() => import('./pages/EditorPage.tsx'));
const DeploymentsPage = lazy(() => import('./pages/DeploymentsPage.tsx'));

export default function App() {
  const location = useLocation();
  return <ChunkErrorBoundary resetKey={location.pathname}><Suspense fallback={<PageSkeleton label="Loading GitFolio" />}><Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
    <Route element={<AuthGuard />}><Route path="/account" element={<AccountPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/projects/new" element={<NewProjectPage />} /><Route path="/projects/:id/edit" element={<EditorPage />} /><Route path="/projects/:id/deployments" element={<DeploymentsPage />} /></Route>
    <Route path="*" element={<main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-3xl font-semibold">Page not found.</h1><Link className="mt-6 inline-block underline" to="/">Back to GitFolio</Link></main>} />
  </Routes></Suspense></ChunkErrorBoundary>;
}
