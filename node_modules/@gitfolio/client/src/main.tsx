import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { ChunkErrorBoundary, PageErrorFallback } from './components/common/ChunkErrorBoundary.tsx';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60000, retry: false } } });
const router = createBrowserRouter([{ path: '*', element: <App />, errorElement: <PageErrorFallback /> }]);
createRoot(document.getElementById('root')!).render(
  <StrictMode><ChunkErrorBoundary><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></ChunkErrorBoundary></StrictMode>,
);
