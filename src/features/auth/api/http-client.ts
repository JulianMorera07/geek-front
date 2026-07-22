import { httpRequest } from '@/lib/http';
import type {
  AuthResult,
  LoginInput,
  RegisterInput,
  Role,
  UpdateProfileInput,
  UpdateSettingsInput,
  User,
} from '@/features/auth/api/types';

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8000/api/v1';

// Formas crudas (snake_case) del backend.
interface RawRole {
  id: string;
  name: string;
  is_system: boolean;
}
interface RawProfile {
  display_name: string;
  avatar_url: string | null;
  bio: string;
}
interface RawSettings {
  language: string;
  theme: string;
  notifications_enabled: boolean;
}
interface RawUser {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  roles: RawRole[];
  permissions: string[];
  profile: RawProfile;
  settings: RawSettings;
  created_at: string;
  updated_at: string;
}
interface RawAuthResult {
  access_token: { value: string; token_type: string; expires_in: number };
  refresh_token: string;
  user: RawUser;
}

function mapRole(raw: RawRole): Role {
  return { id: raw.id, name: raw.name, isSystem: raw.is_system };
}

function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username,
    isActive: raw.is_active,
    isVerified: raw.is_verified,
    roles: raw.roles.map(mapRole),
    permissions: raw.permissions,
    profile: {
      displayName: raw.profile.display_name,
      avatarUrl: raw.profile.avatar_url,
      bio: raw.profile.bio,
    },
    settings: {
      language: raw.settings.language,
      theme: raw.settings.theme,
      notificationsEnabled: raw.settings.notifications_enabled,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapAuthResult(raw: RawAuthResult): AuthResult {
  return {
    accessToken: {
      value: raw.access_token.value,
      tokenType: raw.access_token.token_type,
      expiresIn: raw.access_token.expires_in,
    },
    refreshToken: raw.refresh_token,
    user: mapUser(raw.user),
  };
}

/** POST /auth/register — el backend NO devuelve tokens acá, solo el usuario creado. */
export async function registerRequest(input: RegisterInput): Promise<User> {
  const raw = await httpRequest<RawUser>(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: { email: input.email, username: input.username, password: input.password },
  });
  return mapUser(raw);
}

/** POST /auth/login */
export async function loginRequest(input: LoginInput): Promise<AuthResult> {
  const raw = await httpRequest<RawAuthResult>(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: input.email, password: input.password },
  });
  return mapAuthResult(raw);
}

/** POST /auth/refresh — rota el refresh token: la respuesta trae uno nuevo, el viejo queda invalidado. */
export async function refreshRequest(refreshToken: string): Promise<AuthResult> {
  const raw = await httpRequest<RawAuthResult>(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
  return mapAuthResult(raw);
}

/** POST /auth/logout — no requiere `Authorization`, solo el refresh token a revocar. */
export async function logoutRequest(refreshToken: string): Promise<void> {
  await httpRequest<void>(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

/** GET /auth/me */
export async function fetchMe(accessToken: string): Promise<User> {
  const raw = await httpRequest<RawUser>(`${API_BASE_URL}/auth/me`, { accessToken });
  return mapUser(raw);
}

/** PATCH /auth/profile */
export async function updateProfileRequest(
  accessToken: string,
  input: UpdateProfileInput,
): Promise<User> {
  const raw = await httpRequest<RawUser>(`${API_BASE_URL}/auth/profile`, {
    method: 'PATCH',
    accessToken,
    body: {
      display_name: input.displayName,
      avatar_url: input.avatarUrl,
      bio: input.bio,
    },
  });
  return mapUser(raw);
}

/** PATCH /auth/settings */
export async function updateSettingsRequest(
  accessToken: string,
  input: UpdateSettingsInput,
): Promise<User> {
  const raw = await httpRequest<RawUser>(`${API_BASE_URL}/auth/settings`, {
    method: 'PATCH',
    accessToken,
    body: {
      language: input.language,
      theme: input.theme,
      notifications_enabled: input.notificationsEnabled,
    },
  });
  return mapUser(raw);
}
