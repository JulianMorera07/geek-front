'use client';

import * as React from 'react';

import { authSessionManager } from '@/features/auth/session-manager';

/**
 * Dispara `authSessionManager.hydrate()` una sola vez, al montar en el
 * cliente (restaura la sesión de `localStorage`, valida/renueva el token).
 * No provee un Context — `useAuth()` se conecta directo al singleton.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void authSessionManager.hydrate();
  }, []);

  return children;
}

export { AuthProvider };
