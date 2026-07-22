'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { PageLoader } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';

export interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protege una ruta: mientras se restaura la sesión muestra un loader (nunca
 * un parpadeo hacia "no autenticado"); si no hay sesión, redirige a
 * `/login?redirect=<ruta actual>` para volver acá después de iniciar sesión.
 */
function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader label="Verificando sesión…" />;
  }

  return children;
}

export { AuthGuard };
