'use client';

import * as React from 'react';

import { AnimeFilters, type CatalogFiltersState } from '@/features/anime/components/anime-filters';
import { AnimeInfiniteGrid } from '@/features/anime/components/anime-infinite-grid';
import { useCatalogInfiniteQuery } from '@/features/anime/api/queries';

/** Grid infinito para Genre View. El género ya viene fijo por la ruta; solo se pueden refinar estado/tipo. */
function GenrePageClient({ genreId }: { genreId: string }) {
  const [filters, setFilters] = React.useState<CatalogFiltersState>({ genreId });
  const query = useCatalogInfiniteQuery(filters);
  const animes = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <AnimeFilters value={filters} onChange={setFilters} hideGenre />
      <AnimeInfiniteGrid
        animes={animes}
        isLoading={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasNextPage={Boolean(query.hasNextPage)}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={() => query.fetchNextPage()}
      />
    </div>
  );
}

export { GenrePageClient };
