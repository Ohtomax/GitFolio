import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { ChunkErrorBoundary, PageErrorFallback } from './components/common/ChunkErrorBoundary.tsx';
import { Notifications } from './components/common/Notifications.tsx';
import { createQueryClient } from './lib/query-client.ts';

const queryClient = createQueryClient();
const router = createBrowserRouter([{ path: '*', element: <App />, errorElement: <PageErrorFallback /> }]);
createRoot(document.getElementById('root')!).render(
  <StrictMode><ChunkErrorBoundary><QueryClientProvider client={queryClient}><RouterProvider router={router} /><Notifications /></QueryClientProvider></ChunkErrorBoundary></StrictMode>,
);
