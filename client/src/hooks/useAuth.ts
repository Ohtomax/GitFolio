import { useEffect } from 'react';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSession } from '@gitfolio/shared';
import { ApiError } from '../services/api.ts';
import { authService } from '../services/auth.service.ts';
import { useAuthStore } from '../stores/auth.store.ts';

export const sessionKey = ['auth', 'session'] as const;
export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: async ({ signal }) => {
    try {
      const session = await authService.getSession(signal);
      useAuthStore.getState().setSession(session);
      return session;
    } catch (error) {
      if (signal.aborted) throw error;
      if (error instanceof ApiError && error.status === 401) {
        useAuthStore.getState().clearSession();
        return null;
      }
      useAuthStore.getState().setUnavailable();
      throw error;
    }
  },
  staleTime: 5 * 60000,
  retry: false,
});

export function useAuthSession() {
  const query = useQuery(sessionQueryOptions);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setTimeout(() => {
      if (Date.now() >= expiresAt) {
        useAuthStore.getState().clearSession();
        queryClient.clear();
        queryClient.setQueryData(sessionKey, null);
      } else void queryClient.invalidateQueries({ queryKey: sessionKey });
    }, Math.min(Math.max(expiresAt - Date.now(), 0), 2147483647));
    return () => window.clearTimeout(timer);
  }, [expiresAt, queryClient]);
  return query;
}

export function useCompleteOAuth() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: authService.completeOAuth, retry: false,
    onSuccess: async (session: AuthSession) => {
      await queryClient.cancelQueries();
      queryClient.clear();
      useAuthStore.getState().setSession(session);
      queryClient.setQueryData(sessionKey, session);
      await queryClient.invalidateQueries({ queryKey: sessionKey, refetchType: 'none' });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clear = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    useAuthStore.getState().clearSession();
    queryClient.setQueryData(sessionKey, null);
    await queryClient.invalidateQueries({ queryKey: sessionKey, refetchType: 'none' });
  };
  return useMutation({ mutationFn: authService.logout, onSuccess: clear, retry: false,
    onError: (error) => { if (error instanceof ApiError && error.status === 401) return clear(); },
  });
}
