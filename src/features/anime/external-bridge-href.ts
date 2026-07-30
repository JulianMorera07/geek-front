import type { DiscoveryResult, SourceReference } from '@/features/anime/api/types';

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

/**
 * Destino del click sobre un `DiscoveryResult` (usado por `DiscoveryCard` y
 * `DiscoveryBanner`) — depende de si la fuente principal trae `episodeNumber`:
 * - `/latest` (episodios recién publicados) SÍ lo trae → directo al
 *   reproductor (`/watch/external/...`), sin pasar por la ficha del anime.
 * - `/popular`/`/new-animes`/`/search` (listados de series) lo traen `null`
 *   → al puente `/anime/external/:providerId/:externalId`.
 * `null` si no hay ninguna fuente (nada a dónde ir).
 */
export function discoveryResultHref(result: DiscoveryResult): string | null {
  const primarySource = result.sources[0];
  if (!primarySource) return null;
  if (primarySource.episodeNumber != null) {
    return `/watch/external/${encodeURIComponent(primarySource.providerId)}/${encodeURIComponent(primarySource.externalId)}/${primarySource.episodeNumber}`;
  }
  return externalBridgeHref(primarySource, result.thumbnailUrl);
}
