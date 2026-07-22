'use client';

import * as React from 'react';

import { Heading } from '@/components/base/typography';
import { SearchInput } from '@/components/base/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  AnimeFilters,
  defaultCatalogFilters,
  type CatalogFiltersState,
} from '@/features/anime/components/anime-filters';
import { AnimeInfiniteGrid } from '@/features/anime/components/anime-infinite-grid';
import { DiscoveryInfiniteGrid } from '@/features/anime/components/discovery-infinite-grid';
import { useCatalogInfiniteQuery, useSearchInfiniteQuery } from '@/features/anime/api/queries';

export interface SearchPageClientProps {
  initialQuery?: string;
}

/**
 * Página de búsqueda. El catálogo interno (`GET /anime?q=`) es la fuente
 * primaria. Cuando termina de cargar y no encuentra nada para el término
 * buscado, se cambia (sin mensaje intermedio de "sin resultados" ni etiqueta
 * de "externo") al Provider Framework real (`GET /search`) — para el usuario
 * es un único resultado de búsqueda, sin importar de qué fuente vino. Esas
 * cards llevan al puente `/anime/external/:providerId/:externalId`, que
 * ingiere el anime al catálogo interno en el momento del click.
 */
function SearchPageClient({ initialQuery = '' }: SearchPageClientProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState<CatalogFiltersState>(defaultCatalogFilters);
  const debouncedQuery = useDebouncedValue(query);
  const trimmedQuery = debouncedQuery.trim();

  const queryParams = { ...filters, q: debouncedQuery };
  const catalogQuery = useCatalogInfiniteQuery(queryParams);
  const animes = catalogQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const catalogResolved = !catalogQuery.isPending && !catalogQuery.isError;
  const useExternal = catalogResolved && animes.length === 0 && trimmedQuery.length > 0;

  const externalQuery = useSearchInfiniteQuery(useExternal ? trimmedQuery : '');
  const externalResults = externalQuery.data?.pages.flat() ?? [];

  const emptyTitle = trimmedQuery ? `Sin resultados para "${trimmedQuery}"` : undefined;
  const emptyDescription = 'Prueba con otro título o ajusta los filtros.';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Heading level="h2">Buscar</Heading>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título…"
          className="max-w-md"
          autoFocus
        />
      </div>

      <AnimeFilters value={filters} onChange={setFilters} />

      {useExternal ? (
        <DiscoveryInfiniteGrid
          results={externalResults}
          isLoading={externalQuery.isPending}
          isError={externalQuery.isError}
          onRetry={() => externalQuery.refetch()}
          hasNextPage={Boolean(externalQuery.hasNextPage)}
          isFetchingNextPage={externalQuery.isFetchingNextPage}
          onLoadMore={() => externalQuery.fetchNextPage()}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : (
        <AnimeInfiniteGrid
          animes={animes}
          isLoading={catalogQuery.isPending}
          isError={catalogQuery.isError}
          onRetry={() => catalogQuery.refetch()}
          hasNextPage={Boolean(catalogQuery.hasNextPage)}
          isFetchingNextPage={catalogQuery.isFetchingNextPage}
          onLoadMore={() => catalogQuery.fetchNextPage()}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}
    </div>
  );
}

export { SearchPageClient };
