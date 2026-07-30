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
  // Arranca siempre en `null` (igual en servidor y en el primer render de
  // hidratación/navegación en cliente) y se sincroniza con `localStorage` en
  // un efecto aparte. Leer `localStorage` directo en el inicializador de
  // `useState` produce un valor distinto entre SSR (`null`, `window` no
  // existe) y el primer render en cliente (el valor cacheado real), lo que
  // React detecta como mismatch y tumba la página con el error #418 — mismo
  // bug que ya se corrigió en `EpisodePlayer` para el resume point.
  const [cachedUrl, setCachedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!thumbnailUrl) setCachedUrl(getCachedCover(animeId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; el cambio de anime ya se maneja en el ajuste de estado de abajo.
  }, []);

  // Recalcula al cambiar de anime (ajuste de estado durante el render, no en
  // un efecto — mismo patrón que `EpisodePlayer` para el resume point).
  if (trackedAnimeId !== animeId) {
    setTrackedAnimeId(animeId);
    setCachedUrl(thumbnailUrl ? null : getCachedCover(animeId));
  }

  return <MediaCover seed={animeId} src={thumbnailUrl ?? cachedUrl ?? undefined} {...props} />;
}

export { AnimeCover };
