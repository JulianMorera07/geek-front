/** Tipos mapeados (camelCase) desde `identity_schemas.py` del backend. */

export interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

export interface Profile {
  displayName: string;
  avatarUrl: string | null;
  bio: string;
}

export interface UserSettings {
  language: string;
  theme: string;
  notificationsEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  isVerified: boolean;
  roles: Role[];
  /** Slugs de permiso (ej. `"catalog:read"`, `"profile:update"`). */
  permissions: string[];
  profile: Profile;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AccessToken {
  value: string;
  tokenType: string;
  /** Segundos hasta expirar, relativo al momento de la respuesta. */
  expiresIn: number;
}

export interface AuthResult {
  accessToken: AccessToken;
  refreshToken: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateSettingsInput {
  language?: string;
  theme?: string;
  notificationsEnabled?: boolean;
}
