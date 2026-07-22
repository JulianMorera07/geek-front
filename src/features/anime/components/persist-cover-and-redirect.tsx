'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { setCachedCover } from '@/features/anime/cover-cache';

export interface PersistCoverAndRedirectProps {
  animeId: string;
  coverUrl: string;
}

/**
 * Paso intermedio del puente de ingesta cuando el backend no persistió el
 * `thumbnail_url` pero sí lo teníamos del resultado de búsqueda original
 * (pasado por query string). Guardar en `localStorage` requiere el cliente
 * — por eso esto no es parte del `redirect()` del Server Component de la
 * página del puente.
 */
function PersistCoverAndRedirect({ animeId, coverUrl }: PersistCoverAndRedirectProps) {
  const router = useRouter();

  React.useEffect(() => {
    setCachedCover(animeId, coverUrl);
    router.replace(`/anime/${animeId}`);
  }, [animeId, coverUrl, router]);

  return null;
}

export { PersistCoverAndRedirect };
