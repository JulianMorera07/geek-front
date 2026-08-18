'use client';

import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchAnimeById,
  fetchAnimeEpisodes,
  fetchCatalog,
  fetchCatalogFacets,
  fetchDirectory,
  fetchGenreById,
  fetchGenres,
  fetchLatest,
  fetchPopular,
  fetchSearch,
  reingestAnimeAll,
} from '@/features/anime/api/http-client';
import type { CatalogQueryParams, DirectoryQueryParams, DiscoveryResult } from '@/features/anime/api/types';
import { pageHasNewResults } from '@/features/anime/discovery-dedupe';
import { authSessionManager } from '@/features/auth/session-manager';

/** Query keys centralizadas del dominio anime. */
export const animeKeys = {
  all: ['anime'] as const,
  catalog: (params: Omit<CatalogQueryParams, 'page'>) =>
    [...animeKeys.all, 'catalog', params] as const,
  detail: (id: string) => [...animeKeys.all, 'detail', id] as const,
  episodes: (animeId: string) => [...animeKeys.all, animeId, 'episodes'] as const,
  genres: () => ['genres'] as const,
  genre: (id: string) => ['genres', id] as const,
  facets: () => ['catalog-facets'] as const,
  discoveryPopular: () => ['discovery', 'popular'] as const,
  discoveryLatest: () => ['discovery', 'latest'] as const,
  discoverySearch: (q: string) => ['discovery', 'search', q] as const,
  directory: (params: Omit<DirectoryQueryParams, 'page' | 'pageSize'>) =>
    ['discovery', 'directory', params] as const,
};

/** Catálogo interno con scroll infinito (`total` real → `hasNextPage` exacto, no heurístico). */
export function useCatalogInfiniteQuery(params: Omit<CatalogQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: animeKeys.catalog(params),
    queryFn: ({ pageParam }) => fetchCatalog({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined,
  });
}

/** Series en emisión para la lista lateral del sidebar — solo la primera página, sin scroll infinito. */
export function useOngoingCatalogQuery() {
  return useQuery({
    queryKey: animeKeys.catalog({ status: 'ongoing', pageSize: 12 }),
    queryFn: () => fetchCatalog({ status: 'ongoing', page: 1, pageSize: 12 }),
    staleTime: 60_000,
  });
}

export function useAnimeDetailQuery(animeId: string) {
  return useQuery({
    queryKey: animeKeys.detail(animeId),
    queryFn: () => fetchAnimeById(animeId),
    staleTime: 60_000,
  });
}

/**
 * Botón "Reparar" — SOLO ADMIN (`admin:manage`, ver `PermissionGuard` donde
 * se usa). `callAuthenticated` reintenta una vez con refresh de token si el
 * access token venció — no hace falta manejarlo acá. Al resolver, escribe
 * directo el detalle actualizado en cache (en vez de solo invalidar) para que
 * la ficha refleje las temporadas nuevas sin esperar un refetch, e invalida
 * los episodios sueltos (`EpisodeList`, el fallback sin temporadas) por si el
 * anime pasó de una sola temporada plana a varias reales.
 */
export function useReingestAnimeAllMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (animeId: string) =>
      authSessionManager.callAuthenticated((token) => reingestAnimeAll(animeId, token)),
    onSuccess: (updated) => {
      queryClient.setQueryData(animeKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: animeKeys.episodes(updated.id) });
    },
  });
}

/** El backend pagina `/episodes` server-side, pero `fetchAnimeEpisodes` ya trae todas las páginas concatenadas — la UI sigue paginando solo en el cliente. */
export function useAnimeEpisodesQuery(animeId: string) {
  return useQuery({
    queryKey: animeKeys.episodes(animeId),
    queryFn: () => fetchAnimeEpisodes(animeId),
    staleTime: 60_000,
  });
}

/** Detalle de cada anime relacionado (`relations[]` solo trae ids) — fetch en paralelo, acotado. */
export function useRelatedAnimesQuery(animeIds: string[]) {
  return useQueries({
    queries: animeIds.map((id) => ({
      queryKey: animeKeys.detail(id),
      queryFn: () => fetchAnimeById(id),
      staleTime: 60_000,
    })),
  });
}

export function useGenresQuery() {
  return useQuery({ queryKey: animeKeys.genres(), queryFn: fetchGenres, staleTime: 5 * 60_000 });
}

export function useGenreQuery(genreId: string) {
  return useQuery({
    queryKey: animeKeys.genre(genreId),
    queryFn: () => fetchGenreById(genreId),
    staleTime: 5 * 60_000,
  });
}

/** Opciones para armar filtros (tipos/estados/géneros/...) sin N+1 queries. */
export function useCatalogFacetsQuery() {
  return useQuery({
    queryKey: animeKeys.facets(),
    queryFn: fetchCatalogFacets,
    staleTime: 5 * 60_000,
  });
}

/**
 * `/popular` y `/latest` (Provider Framework) no devuelven `total` — se
 * infiere que hay más páginas si la última trajo un página completa.
 */
function inferHasNextPage(
  lastPage: DiscoveryResult[],
  allPages: DiscoveryResult[][],
  pageSize: number,
): boolean {
  if (lastPage.length < pageSize) return false;
  // Algunos proveedores, al pasar la última página real, repiten los mismos
  // resultados en vez de devolver una página corta o vacía — si la "nueva"
  // página no trae nada que no hayamos visto ya, se corta el scroll acá.
  return pageHasNewResults(lastPage, allPages.slice(0, -1));
}

const DISCOVERY_PAGE_SIZE = 20;

export function usePopularInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: animeKeys.discoveryPopular(),
    queryFn: ({ pageParam }) => fetchPopular({ page: pageParam, pageSize: DISCOVERY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      inferHasNextPage(lastPage, allPages, DISCOVERY_PAGE_SIZE) ? allPages.length + 1 : undefined,
  });
}

export function useLatestInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: animeKeys.discoveryLatest(),
    queryFn: ({ pageParam }) => fetchLatest({ page: pageParam, pageSize: DISCOVERY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      inferHasNextPage(lastPage, allPages, DISCOVERY_PAGE_SIZE) ? allPages.length + 1 : undefined,
  });
}

/** Directorio filtrable (`GET /directory`) — mismo patrón heurístico de `hasNextPage` que `/popular`/`/latest`. */
export function useDirectoryInfiniteQuery(params: Omit<DirectoryQueryParams, 'page' | 'pageSize'>) {
  return useInfiniteQuery({
    queryKey: animeKeys.directory(params),
    queryFn: ({ pageParam }) =>
      fetchDirectory({ ...params, page: pageParam, pageSize: DISCOVERY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      inferHasNextPage(lastPage, allPages, DISCOVERY_PAGE_SIZE) ? allPages.length + 1 : undefined,
  });
}

/**
 * Búsqueda contra el Provider Framework (`GET /search`) — se usa como respaldo
 * cuando el catálogo interno no tiene resultados para el término buscado
 * (hoy: siempre, porque el catálogo interno está vacío). `enabled` exige `q`
 * no vacío porque el backend rechaza `q` vacío con 422.
 */
export function useSearchInfiniteQuery(q: string) {
  const trimmed = q.trim();
  return useInfiniteQuery({
    queryKey: animeKeys.discoverySearch(trimmed),
    queryFn: ({ pageParam }) =>
      fetchSearch({ q: trimmed, page: pageParam, pageSize: DISCOVERY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      inferHasNextPage(lastPage, allPages, DISCOVERY_PAGE_SIZE) ? allPages.length + 1 : undefined,
    enabled: trimmed.length > 0,
  });
}
