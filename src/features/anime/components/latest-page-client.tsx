'use client';

import { useLatestInfiniteQuery } from '@/features/anime/api/queries';
import { DiscoveryInfiniteGrid } from '@/features/anime/components/discovery-infinite-grid';
import { dedupeDiscoveryResults } from '@/features/anime/discovery-dedupe';

/** Últimos: agregación en vivo de proveedores externos (`GET /latest`). Sin filtros — la API no los soporta acá. */
function LatestPageClient() {
  const query = useLatestInfiniteQuery();
  const results = dedupeDiscoveryResults(query.data?.pages.flat() ?? []);

  return (
    <DiscoveryInfiniteGrid
      results={results}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => query.refetch()}
      hasNextPage={Boolean(query.hasNextPage)}
      isFetchingNextPage={query.isFetchingNextPage}
      onLoadMore={() => query.fetchNextPage()}
    />
  );
}

export { LatestPageClient };
