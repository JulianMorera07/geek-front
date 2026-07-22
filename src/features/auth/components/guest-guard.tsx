'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { PageLoader } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';

/** Inverso de `AuthGuard`: para login/registro/recuperación — si ya hay sesión, redirige a `/`. */
function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return <PageLoader label="Cargando…" />;
  }

  return children;
}

export { GuestGuard };
