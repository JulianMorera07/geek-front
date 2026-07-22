import type { SourceReference } from '@/features/anime/api/types';

/**
 * Arma el link al puente de ingesta, pasando la miniatura del resultado de
 * búsqueda (si la hay) como query string — el backend la descarta al
 * ingerir, así que se cachea del lado del cliente (ver `cover-cache.ts`,
 * `PersistCoverAndRedirect`).
 */
export function externalBridgeHref(source: SourceReference, thumbnailUrl: string | null): string {
  const base = `/anime/external/${encodeURIComponent(source.providerId)}/${encodeURIComponent(source.externalId)}`;
  if (!thumbnailUrl) return base;
  return `${base}?thumbnail=${encodeURIComponent(thumbnailUrl)}`;
}
