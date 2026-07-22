'use client';

import * as React from 'react';

import { MediaCover, type MediaCoverProps } from '@/components/base/media-cover';
import { getCachedCover } from '@/features/anime/cover-cache';

export interface AnimeCoverProps extends Omit<MediaCoverProps, 'seed' | 'src'> {
  animeId: string;
  thumbnailUrl?: string | null;
}

/**
 * `MediaCover` para un anime del catálogo interno, con fallback a la
 * miniatura cacheada en `localStorage` (ver `cover-cache.ts`) cuando el
 * backend no la persistió al ingerir. Sin esto, cualquier anime ingerido vía
 * el puente externo se queda con el placeholder de gradiente para siempre,
 * aunque el resultado de búsqueda sí tenía una imagen real un instante antes.
 */
function AnimeCover({ animeId, thumbnailUrl, ...props }: AnimeCoverProps) {
  const [trackedAnimeId, setTrackedAnimeId] = React.useState(animeId);
  const [cachedUrl, setCachedUrl] = React.useState<string | null>(() =>
    thumbnailUrl || typeof window === 'undefined' ? null : getCachedCover(animeId),
  );

  // Recalcula al cambiar de anime (ajuste de estado durante el render, no en
  // un efecto — mismo patrón que `WatchPageClient` para el resume point).
  if (trackedAnimeId !== animeId) {
    setTrackedAnimeId(animeId);
    setCachedUrl(thumbnailUrl ? null : getCachedCover(animeId));
  }

  return <MediaCover seed={animeId} src={thumbnailUrl ?? cachedUrl ?? undefined} {...props} />;
}

export { AnimeCover };
