import { create } from 'zustand';
import type { AuthSession, AuthUser } from '@gitfolio/shared';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';
interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  expiresAt: number | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setUnavailable: () => void;
}

// Session credentials live in an HttpOnly cookie. This store deliberately has no persistence middleware.
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'checking', user: null, expiresAt: null,
  setSession: (session) => set(session.expiresAt > Date.now()
    ? { status: 'authenticated', user: session.user, expiresAt: session.expiresAt }
    : { status: 'anonymous', user: null, expiresAt: null }),
  clearSession: () => set({ status: 'anonymous', user: null, expiresAt: null }),
  setUnavailable: () => set({ status: 'unavailable', user: null, expiresAt: null }),
}));
