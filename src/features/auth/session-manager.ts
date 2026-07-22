import { ApiError, isUnauthorizedError } from '@/lib/api-error';
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  updateProfileRequest,
  updateSettingsRequest,
} from '@/features/auth/api/http-client';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type StoredSession,
} from '@/features/auth/token-storage';
import type {
  AuthResult,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateSettingsInput,
} from '@/features/auth/api/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  session: StoredSession | null;
}

type Listener = () => void;

/** Margen de seguridad antes de la expiración real para disparar el refresh proactivo. */
const REFRESH_BUFFER_MS = 60_000;

function toStoredSession(auth: AuthResult): StoredSession {
  return {
    user: auth.user,
    accessToken: auth.accessToken.value,
    accessTokenExpiresAt: Date.now() + auth.accessToken.expiresIn * 1000,
    refreshToken: auth.refreshToken,
  };
}

/**
 * Dueño único del estado de sesión — un singleton plano (no un componente
 * React) para que tanto la UI (vía `useAuth`, `useSyncExternalStore`) como
 * la capa HTTP (que no es un componente y necesita el token/refresh-and-retry)
 * puedan acceder a la misma fuente de verdad sin pasar por Context.
 */
class AuthSessionManager {
  private state: AuthState = { status: 'idle', session: null };
  private listeners = new Set<Listener>();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<StoredSession> | null = null;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): AuthState => this.state;

  private setState(next: Partial<AuthState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Se llama una sola vez en el cliente (`AuthProvider`, en un efecto).
   * Restaura la sesión de `localStorage`: si el access token sigue vigente
   * se confía en él de entrada (evita un round-trip extra en cada carga de
   * página) y se valida en segundo plano contra `GET /me`; si ya expiró, se
   * intenta un refresh antes de decidir.
   */
  async hydrate(): Promise<void> {
    if (this.state.status !== 'idle') return;

    const stored = readStoredSession();
    if (!stored) {
      this.setState({ status: 'unauthenticated', session: null });
      return;
    }

    const isExpired = stored.accessTokenExpiresAt <= Date.now() + 5_000;
    if (isExpired) {
      try {
        await this.refresh(stored.refreshToken);
      } catch {
        // `refresh` ya deja el estado en `unauthenticated` si falla.
      }
      return;
    }

    this.setState({ status: 'authenticated', session: stored });
    this.scheduleRefresh(stored);
    void this.syncUser(stored.accessToken);
  }

  /** Revalida el usuario en segundo plano — no bloquea ni desloguea ante errores de red/timeout. */
  private async syncUser(accessToken: string) {
    try {
      const user = await fetchMe(accessToken);
      if (this.state.session) {
        const updated: StoredSession = { ...this.state.session, user };
        writeStoredSession(updated);
        this.setState({ session: updated });
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        try {
          await this.refresh();
        } catch {
          // `refresh` ya limpió la sesión.
        }
      }
    }
  }

  async login(input: LoginInput) {
    const result = await loginRequest(input);
    this.applyAuthResult(result);
    return result.user;
  }

  /** `POST /auth/register` no devuelve tokens — se hace login con las mismas credenciales después. */
  async register(input: RegisterInput) {
    await registerRequest(input);
    return this.login({ email: input.email, password: input.password });
  }

  async logout(): Promise<void> {
    const refreshToken = this.state.session?.refreshToken;
    this.clear();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Best-effort: la sesión local ya se limpió; si el revoke en el
        // servidor falla (ej. red), no hay nada más que la UI pueda hacer.
      }
    }
  }

  clear(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    clearStoredSession();
    this.setState({ status: 'unauthenticated', session: null });
  }

  private applyAuthResult(auth: AuthResult) {
    const session = toStoredSession(auth);
    writeStoredSession(session);
    this.setState({ status: 'authenticated', session });
    this.scheduleRefresh(session);
  }

  private scheduleRefresh(session: StoredSession) {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const delay = Math.max(session.accessTokenExpiresAt - Date.now() - REFRESH_BUFFER_MS, 5_000);
    this.refreshTimer = setTimeout(() => void this.refresh(), delay);
  }

  /**
   * Refresh silencioso, con dedupe: si varias llamadas 401 casi al mismo
   * tiempo disparan un refresh, todas esperan la misma promesa en vez de
   * lanzar múltiples requests de refresh en paralelo (el backend rota el
   * refresh token — el segundo request con el token viejo fallaría).
   */
  async refresh(refreshTokenOverride?: string): Promise<StoredSession> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshToken = refreshTokenOverride ?? this.state.session?.refreshToken;
    if (!refreshToken) {
      this.clear();
      throw new ApiError('No hay sesión para renovar.', { status: 401, code: 'no_session' });
    }

    this.refreshPromise = (async () => {
      try {
        const result = await refreshRequest(refreshToken);
        const session = toStoredSession(result);
        writeStoredSession(session);
        this.setState({ status: 'authenticated', session });
        this.scheduleRefresh(session);
        return session;
      } catch (error) {
        this.clear();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  getAccessToken(): string | null {
    return this.state.session?.accessToken ?? null;
  }

  async updateProfile(input: UpdateProfileInput) {
    const user = await this.callAuthenticated((token) => updateProfileRequest(token, input));
    this.updateSessionUser(user);
    return user;
  }

  async updateSettings(input: UpdateSettingsInput) {
    const user = await this.callAuthenticated((token) => updateSettingsRequest(token, input));
    this.updateSessionUser(user);
    return user;
  }

  private updateSessionUser(user: StoredSession['user']) {
    if (!this.state.session) return;
    const updated: StoredSession = { ...this.state.session, user };
    writeStoredSession(updated);
    this.setState({ session: updated });
  }

  /**
   * Ejecuta una llamada autenticada con refresh-and-retry automático: si
   * falla por token expirado/inválido (401/403), intenta un refresh una
   * sola vez y reintenta. Si el refresh también falla, la sesión ya quedó
   * limpia y el error se propaga (la UI reacciona redirigiendo a login).
   */
  async callAuthenticated<T>(fn: (accessToken: string) => Promise<T>): Promise<T> {
    const token = this.getAccessToken();
    if (!token) {
      throw new ApiError('No hay sesión activa.', { status: 401, code: 'no_session' });
    }
    try {
      return await fn(token);
    } catch (error) {
      if (!isUnauthorizedError(error)) throw error;
      const session = await this.refresh();
      return fn(session.accessToken);
    }
  }
}

export const authSessionManager = new AuthSessionManager();
