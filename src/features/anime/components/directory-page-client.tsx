'use client';

import * as React from 'react';

import { useDirectoryInfiniteQuery } from '@/features/anime/api/queries';
import { DiscoveryInfiniteGrid } from '@/features/anime/components/discovery-infinite-grid';
import { dedupeDiscoveryResults } from '@/features/anime/discovery-dedupe';
import {
  DirectoryFilters,
  defaultDirectoryFilters,
  type DirectoryFiltersState,
} from '@/features/anime/components/directory-filters';

/** Directorio filtrable (`GET /directory`) — agrega y deduplica jkanime + tioanime. */
function DirectoryPageClient() {
  const [filters, setFilters] = React.useState<DirectoryFiltersState>(defaultDirectoryFilters);
  const query = useDirectoryInfiniteQuery(filters);
  const results = dedupeDiscoveryResults(query.data?.pages.flat() ?? []);

  return (
    <div className="flex flex-col gap-4">
      <DirectoryFilters value={filters} onChange={setFilters} />
      <DiscoveryInfiniteGrid
        results={results}
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

export { DirectoryPageClient };
