import { ApiError } from '@/lib/api-error';
import { resolveMediaUrl } from '@/lib/http';
import { resolveApiBaseUrl } from '@/lib/http';
import type {
  AnimeDetail,
  AnimeSummary,
  CatalogFacets,
  CatalogQueryParams,
  DiscoveryQueryParams,
  DiscoveryResult,
  Episode,
  ExternalId,
  Genre,
  Media,
  Page,
  Rating,
  Relation,
  SearchQueryParams,
  Season,
  StreamingSource,
} from '@/features/anime/api/types';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Algunos endpoints del Provider Framework pueden tardar muchísimo (llaman a
 * proveedores externos reales — Jikan, etc. — con su propio rate limit/retry).
 * Sin un límite propio, una sola request lenta cuelga la página entera
 * (medido en vivo: `/popular` tardó >90s sin responder). Pasado este tiempo
 * se aborta y se trata como error, para que loading/error states reaccionen
 * en un tiempo razonable en vez de dejar la UI colgada indefinidamente.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Cliente HTTP central hacia el backend real. Parsea el shape de error
 * consistente del backend (`{"error": {"code","message"}}`) y también
 * tolera respuestas no-JSON (ej. tracebacks en texto plano cuando el
 * backend corre con `debug=true`), para que un 500 nunca rompa el parseo
 * en el cliente — siempre termina en un `ApiError` manejable por `ErrorView`.
 */
async function apiFetch<T>(
  path: string,
  params?: Record<string, string | undefined>,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  // new URL() requiere una URL absoluta.
  // Si API_BASE_URL es relativa (/api/v1):
  //   - En el browser usamos window.location.origin como base
  //   - En el servidor (SSR/Node.js) usamos 127.0.0.1 explícito, no
  //     "localhost": en Alpine, "localhost" puede resolver primero a `::1`
  //     (IPv6) mientras el server de Next solo escucha en IPv4 (`0.0.0.0`),
  //     y esa carrera produce `ECONNREFUSED`/`NETWORK_ERROR` intermitentes
  //     en el fetch de la propia app hacia sí misma (confirmado en producción).
  const base = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : typeof window !== 'undefined'
      ? `${window.location.origin}${API_BASE_URL}`
      : `http://127.0.0.1:${process.env.PORT ?? '3000'}${API_BASE_URL}`;

  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    // `cache: 'no-store'`: los datos vienen de un backend real y en vivo
    // (catálogo interno + Provider Framework) — nunca deben quedar
    // congelados en el cache de build de Next.js ni servidos "stale" desde
    // una request anterior. El cache de cliente lo maneja React Query.
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[apiFetch] timeout tras ${timeoutMs}ms → ${url}`);
      throw new ApiError('El servidor tardó demasiado en responder.', {
        status: 408,
        code: 'TIMEOUT',
      });
    }
    console.error(`[apiFetch] no se pudo conectar → ${url}`, error);
    throw new ApiError('No se pudo conectar con el servidor.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Error ${response.status} al consultar la API.`;
    let rawBody: unknown;
    try {
      rawBody = await response.json();
      const body = rawBody as { error?: { code?: string; message?: string } };
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // Respuesta no-JSON (ej. traceback en texto plano) — se usa el mensaje genérico.
    }
    console.error(`[apiFetch] ${response.status} ${response.statusText} → ${url}`, rawBody ?? '(sin body JSON)');
    throw new ApiError(message, { status: response.status, code });
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Mappers snake_case (backend) → camelCase (frontend)
// ---------------------------------------------------------------------------

function mapRating(raw: RawRating | null | undefined): Rating | null {
  if (!raw) return null;
  return { score: raw.score, votes: raw.votes ?? null, source: raw.source };
}

function mapMedia(raw: RawMedia[] | undefined): Media[] {
  return (raw ?? []).map((m) => ({ kind: m.kind, url: resolveMediaUrl(m.url) ?? m.url }));
}

function mapExternalIds(raw: RawExternalId[] | undefined): ExternalId[] {
  return (raw ?? []).map((e) => ({ source: e.source, value: e.value }));
}

function mapStreamingSources(raw: RawStreamingSource[] | undefined): StreamingSource[] {
  return (raw ?? []).map((s) => ({
    id: s.id,
    providerName: s.provider_name,
    externalRef: s.external_ref,
    quality: s.quality,
    audioLanguage: s.audio_language,
    subtitleLanguage: s.subtitle_language ?? null,
    url: s.url ?? null,
    isActive: s.is_active,
  }));
}

function mapAnimeSummary(raw: RawAnimeSummary): AnimeSummary {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    type: raw.type,
    status: raw.status,
    countryCode: raw.country_code ?? null,
    thumbnailUrl: resolveMediaUrl(raw.thumbnail_url),
    rating: mapRating(raw.rating),
  };
}

function mapRelations(raw: RawRelation[] | undefined): Relation[] {
  return (raw ?? []).map((r) => ({
    relatedAnimeId: r.related_anime_id,
    relationType: r.relation_type,
  }));
}

function mapSeasons(raw: RawSeason[] | undefined): Season[] {
  return (raw ?? []).map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title ?? null,
    episodes: (s.episodes ?? []).map(mapEpisode),
  }));
}

function mapAnimeDetail(raw: RawAnimeDetail): AnimeDetail {
  return {
    ...mapAnimeSummary(raw),
    synopsis: raw.synopsis ?? null,
    genreIds: raw.genre_ids ?? [],
    studioIds: raw.studio_ids ?? [],
    producerIds: raw.producer_ids ?? [],
    tagIds: raw.tag_ids ?? [],
    media: mapMedia(raw.media),
    bannerUrl: resolveMediaUrl(raw.banner_url),
    trailerUrl: raw.trailer_url ?? null,
    externalIds: mapExternalIds(raw.external_ids),
    relations: mapRelations(raw.relations),
    seasons: mapSeasons(raw.seasons),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapEpisode(raw: RawEpisode): Episode {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    synopsis: raw.synopsis ?? null,
    durationMinutes: raw.duration_minutes ?? null,
    airDate: raw.air_date ?? null,
    media: mapMedia(raw.media),
    externalIds: mapExternalIds(raw.external_ids),
    streamingSources: mapStreamingSources(raw.streaming_sources),
  };
}

function mapGenre(raw: RawGenre): Genre {
  return { id: raw.id, name: raw.name, slug: raw.slug };
}

function mapDiscoveryResult(raw: RawDiscoveryResult): DiscoveryResult {
  return {
    title: raw.title,
    thumbnailUrl: resolveMediaUrl(raw.thumbnail_url),
    animeType: raw.anime_type ?? null,
    year: raw.year ?? null,
    sources: (raw.sources ?? []).map((s) => ({
      providerId: s.provider_id,
      externalId: s.external_id,
      priority: s.priority,
      responseTimeMs: s.response_time_ms,
    })),
    completenessScore: raw.completeness_score,
    qualityScore: raw.quality_score,
  };
}

// Formas crudas (snake_case) tal como las devuelve el backend.
interface RawRating {
  score: number;
  votes?: number | null;
  source: string;
}
interface RawMedia {
  kind: string;
  url: string;
}
interface RawExternalId {
  source: string;
  value: string;
}
interface RawStreamingSource {
  id: string;
  provider_name: string;
  external_ref: string;
  quality: string;
  audio_language: string;
  subtitle_language?: string | null;
  url?: string | null;
  is_active: boolean;
}
interface RawRelation {
  related_anime_id: string;
  relation_type: string;
}
interface RawAnimeSummary {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  country_code?: string | null;
  thumbnail_url?: string | null;
  rating?: RawRating | null;
}
interface RawSeason {
  id: string;
  number: number;
  title?: string | null;
  episodes?: RawEpisode[];
}
interface RawAnimeDetail extends RawAnimeSummary {
  synopsis?: string | null;
  genre_ids?: string[];
  studio_ids?: string[];
  producer_ids?: string[];
  tag_ids?: string[];
  media?: RawMedia[];
  banner_url?: string | null;
  trailer_url?: string | null;
  external_ids?: RawExternalId[];
  relations?: RawRelation[];
  seasons?: RawSeason[];
  created_at: string;
  updated_at: string;
}
interface RawEpisode {
  id: string;
  number: number;
  title: string;
  synopsis?: string | null;
  duration_minutes?: number | null;
  air_date?: string | null;
  media?: RawMedia[];
  external_ids?: RawExternalId[];
  streaming_sources?: RawStreamingSource[];
}
interface RawGenre {
  id: string;
  name: string;
  slug: string;
}
interface RawCatalogFacets {
  types: string[];
  statuses: string[];
  genres: RawGenre[];
  studios: { id: string; name: string; slug: string; country_code?: string | null }[];
  producers: { id: string; name: string; slug: string; country_code?: string | null }[];
  tags: { id: string; name: string; slug: string }[];
}
interface RawSourceReference {
  provider_id: string;
  external_id: string;
  priority: number;
  response_time_ms: number;
}
interface RawDiscoveryResult {
  title: string;
  thumbnail_url?: string | null;
  anime_type?: string | null;
  year?: number | null;
  sources?: RawSourceReference[];
  completeness_score: number;
  quality_score: number;
}
interface RawPage<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** GET /anime — catálogo interno: búsqueda + filtros + paginación real (con `total`). */
export async function fetchCatalog(params: CatalogQueryParams = {}): Promise<Page<AnimeSummary>> {
  const raw = await apiFetch<RawPage<RawAnimeSummary>>('/anime', {
    q: params.q,
    status: params.status,
    type: params.type,
    genre_id: params.genreId,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20),
  });
  return {
    items: raw.items.map(mapAnimeSummary),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
  };
}

/** GET /anime/:id — 404 real (`ApiError`) si no existe. */
export async function fetchAnimeById(animeId: string): Promise<AnimeDetail> {
  const raw = await apiFetch<RawAnimeDetail>(`/anime/${encodeURIComponent(animeId)}`);
  return mapAnimeDetail(raw);
}

/**
 * GET /anime/external/:providerId/:externalId — puente entre un resultado de
 * `/search`, `/latest` o `/popular` (sin `id` propio) y el catálogo interno.
 * Si el anime no fue ingerido antes, el backend lo trae del provider externo
 * (detalle + episodios + fuentes) y lo persiste en el momento — puede tardar
 * más que una consulta normal. 404 real si el provider no tiene ese external_id.
 */
const EXTERNAL_INGEST_TIMEOUT_MS = 30_000;

export async function fetchAnimeByExternalReference(
  providerId: string,
  externalId: string,
): Promise<AnimeDetail> {
  const raw = await apiFetch<RawAnimeDetail>(
    `/anime/external/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}`,
    undefined,
    EXTERNAL_INGEST_TIMEOUT_MS,
  );
  return mapAnimeDetail(raw);
}

/** GET /anime/:id/episodes — el backend devuelve todos los episodios ya aplanados, sin paginar. */
export async function fetchAnimeEpisodes(animeId: string): Promise<Episode[]> {
  const raw = await apiFetch<RawEpisode[]>(`/anime/${encodeURIComponent(animeId)}/episodes`);
  return raw.map(mapEpisode);
}

/** GET /genres */
export async function fetchGenres(): Promise<Genre[]> {
  const raw = await apiFetch<RawGenre[]>('/genres');
  return raw.map(mapGenre);
}

/** GET /genres/:id — 404 real si no existe. */
export async function fetchGenreById(genreId: string): Promise<Genre> {
  const raw = await apiFetch<RawGenre>(`/genres/${encodeURIComponent(genreId)}`);
  return mapGenre(raw);
}

/** GET /catalog — facetas para armar los filtros (tipos/estados/géneros/estudios/productoras/tags). */
export async function fetchCatalogFacets(): Promise<CatalogFacets> {
  const raw = await apiFetch<RawCatalogFacets>('/catalog');
  return {
    types: raw.types,
    statuses: raw.statuses,
    genres: raw.genres.map(mapGenre),
    studios: raw.studios.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      countryCode: s.country_code ?? null,
    })),
    producers: raw.producers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      countryCode: p.country_code ?? null,
    })),
    tags: raw.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  };
}

/**
 * GET /popular, /latest — Provider Framework: agregación en vivo de proveedores
 * externos. Devuelve un array plano (sin `total`/`hasNextPage`) — se infiere
 * si hay más páginas comparando el tamaño recibido contra `pageSize`.
 */
export async function fetchPopular(params: DiscoveryQueryParams = {}): Promise<DiscoveryResult[]> {
  const raw = await apiFetch<RawDiscoveryResult[]>('/popular', {
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20),
  });
  return raw.map(mapDiscoveryResult);
}

export async function fetchLatest(params: DiscoveryQueryParams = {}): Promise<DiscoveryResult[]> {
  const raw = await apiFetch<RawDiscoveryResult[]>('/latest', {
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20),
  });
  return raw.map(mapDiscoveryResult);
}

/**
 * GET /search — Provider Framework, agregación en vivo por título (`q` es
 * obligatorio, min. 1 carácter). A diferencia del catálogo interno, esto sí
 * tiene datos reales hoy (el catálogo interno está vacío, sin seed). No trae
 * `id` propio — ver `DiscoveryResult`.
 */
export async function fetchSearch(params: SearchQueryParams): Promise<DiscoveryResult[]> {
  const raw = await apiFetch<RawDiscoveryResult[]>('/search', {
    q: params.q,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20),
  });
  return raw.map(mapDiscoveryResult);
}