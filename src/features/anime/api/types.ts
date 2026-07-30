/**
 * Tipos del dominio anime — mapeados 1:1 (en camelCase) desde los schemas
 * reales del backend (`GET /api/v1/openapi.json`). Ver `docs/api-integration.md`
 * para el contrato completo y las decisiones de mapeo.
 */

export interface Rating {
  score: number;
  votes: number | null;
  source: string;
}

export interface Media {
  kind: string;
  url: string;
}

export interface ExternalId {
  source: string;
  value: string;
}

export interface StreamingSource {
  id: string;
  providerName: string;
  externalRef: string;
  quality: string;
  audioLanguage: string;
  subtitleLanguage: string | null;
  url: string | null;
  isActive: boolean;
}

export interface Relation {
  relatedAnimeId: string;
  relationType: string;
}

/** Item del catálogo interno (`GET /anime`) — tiene id/slug propios, siempre linkeable a Detalle. */
export interface AnimeSummary {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  countryCode: string | null;
  thumbnailUrl: string | null;
  rating: Rating | null;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number | null;
  airDate: string | null;
  media: Media[];
  externalIds: ExternalId[];
  streamingSources: StreamingSource[];
}

export interface Season {
  id: string;
  number: number;
  title: string | null;
  episodes: Episode[];
}

export interface AnimeDetail extends AnimeSummary {
  synopsis: string | null;
  genreIds: string[];
  studioIds: string[];
  producerIds: string[];
  tagIds: string[];
  media: Media[];
  bannerUrl: string | null;
  trailerUrl: string | null;
  externalIds: ExternalId[];
  relations: Relation[];
  seasons: Season[];
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  countryCode: string | null;
}

export interface Producer {
  id: string;
  name: string;
  slug: string;
  countryCode: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

/** `GET /catalog` — opciones disponibles para armar filtros (no requiere N+1 queries). */
export interface CatalogFacets {
  types: string[];
  statuses: string[];
  genres: Genre[];
  studios: Studio[];
  producers: Producer[];
  tags: Tag[];
}

/**
 * Resultado del Provider Framework (`GET /search`, `/latest`, `/popular`).
 * A propósito NO tiene `id` propio — es una agregación en vivo de proveedores
 * externos, no una entrada del catálogo interno. No se puede linkear directo
 * a `/anime/[id]`; ver `docs/api-integration.md` sección "Discovery vs catálogo".
 */
export interface SourceReference {
  providerId: string;
  externalId: string;
  priority: number;
  responseTimeMs: number;
  /** Solo viene poblado en `/latest` (episodios recién publicados) — `null` en `/popular`, `/new-animes` y `/search`, que listan series, no capítulos. */
  episodeNumber: number | null;
}

export interface DiscoveryResult {
  title: string;
  thumbnailUrl: string | null;
  animeType: string | null;
  year: number | null;
  sources: SourceReference[];
  completenessScore: number;
  qualityScore: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogQueryParams {
  q?: string;
  status?: string;
  type?: string;
  genreId?: string;
  page?: number;
  pageSize?: number;
}

export interface DiscoveryQueryParams {
  page?: number;
  pageSize?: number;
}

/** Tipos aceptados por `type` en `GET /new-animes` (pestañas "Películas/Ovas/Especiales nuevos"). */
export type NewAnimeType = 'Movie' | 'OVA' | 'Special';

/** `GET /new-animes` — series nuevas agregadas al catálogo (no episodios, ver `/latest`). */
export interface NewAnimesQueryParams extends DiscoveryQueryParams {
  providerIds?: string[];
  type?: NewAnimeType;
}

/** `GET /search` (Provider Framework) — a diferencia de `/latest`/`/popular`, `q` es obligatorio. */
export interface SearchQueryParams {
  q: string;
  page?: number;
  pageSize?: number;
}
