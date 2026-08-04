'use client';

import * as React from 'react';

import { Heading, Text } from '@/components/base/typography';
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

  // El catálogo interno hoy está mayormente vacío/inestable — la fuente real
  // de resultados es `/search` (Provider Framework). Antes solo se caía a la
  // externa cuando el catálogo respondía vacío; si directamente fallaba
  // (error, no solo "sin resultados"), se quedaba mostrando ese error en vez
  // de probar la fuente que sí funciona. Ahora cualquiera de los dos casos
  // dispara la externa.
  const catalogSettled = !catalogQuery.isPending;
  const useExternal =
    catalogSettled && trimmedQuery.length > 0 && (catalogQuery.isError || animes.length === 0);

  const externalQuery = useSearchInfiniteQuery(useExternal ? trimmedQuery : '');
  const externalResults = externalQuery.data?.pages.flat() ?? [];

  const emptyTitle = trimmedQuery ? `Sin resultados para "${trimmedQuery}"` : undefined;
  const emptyDescription = 'Prueba con otro título o ajusta los filtros.';

  const activeQuery = useExternal ? externalQuery : catalogQuery;
  const resultCount = useExternal ? externalResults.length : animes.length;
  const isSettled = !activeQuery.isPending && !activeQuery.isError;
  const showCount = trimmedQuery.length > 0 && isSettled && resultCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Heading level="h2">
          {trimmedQuery ? (
            <>
              Resultados para <span className="text-brand">&quot;{trimmedQuery}&quot;</span>
            </>
          ) : (
            'Buscar'
          )}
        </Heading>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título…"
          className="max-w-md"
          autoFocus
        />
        {showCount ? (
          <Text variant="muted">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            {activeQuery.hasNextPage ? ' (sigue cargando más al hacer scroll)' : ''}
          </Text>
        ) : null}
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
