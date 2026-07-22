import type { User } from '@/features/auth/api/types';

const STORAGE_KEY = 'geekbaku.auth.session.v1';

export interface StoredSession {
  user: User;
  accessToken: string;
  /** epoch ms — momento absoluto en que expira el access token. */
  accessTokenExpiresAt: number;
  refreshToken: string;
}

/**
 * Persistencia de sesión en `localStorage`.
 *
 * Trade-off consciente: este backend devuelve los tokens en el body de la
 * respuesta (no en cookies `Set-Cookie` httpOnly), así que el cliente es
 * quien tiene que guardarlos — no hay otra opción sin cambiar el backend.
 * `localStorage` es vulnerable a XSS (un script malicioso podría leer el
 * token); se documenta en `docs/auth-integration.md` como mejora futura
 * migrar a cookies httpOnly + `sameSite` una vez el backend las soporte.
 */
export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
