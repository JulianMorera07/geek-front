'use client';

import * as React from 'react';

import { authSessionManager, type AuthState } from '@/features/auth/session-manager';
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  User,
} from '@/features/auth/api/types';

// Referencia estable: `useSyncExternalStore` exige que `getServerSnapshot`
// devuelva siempre la MISMA referencia entre llamadas (si no, React asume
// que "cambió" en cada render y advierte de un posible loop infinito).
const SERVER_SNAPSHOT: AuthState = { status: 'loading', session: null };

export interface UseAuthResult {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  isAuthenticated: boolean;
  /** Todavía restaurando la sesión desde `localStorage` — usar para no parpadear a "no autenticado". */
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  updateSettings: (input: UpdateSettingsInput) => Promise<User>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

/** Se conecta al singleton `authSessionManager` (no un Context) vía `useSyncExternalStore`. */
export function useAuth(): UseAuthResult {
  const state = React.useSyncExternalStore(
    authSessionManager.subscribe,
    authSessionManager.getState,
    () => SERVER_SNAPSHOT,
  );

  const user = state.session?.user ?? null;

  return {
    status: state.status,
    user,
    isAuthenticated: state.status === 'authenticated',
    isLoading: state.status === 'idle' || state.status === 'loading',
    login: (input) => authSessionManager.login(input),
    register: (input) => authSessionManager.register(input),
    logout: () => authSessionManager.logout(),
    updateProfile: (input) => authSessionManager.updateProfile(input),
    updateSettings: (input) => authSessionManager.updateSettings(input),
    hasPermission: (permission) => user?.permissions.includes(permission) ?? false,
    hasRole: (role) => user?.roles.some((r) => r.name === role) ?? false,
  };
}
