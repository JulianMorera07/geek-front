'use client';

import { usePopularInfiniteQuery } from '@/features/anime/api/queries';
import { DiscoveryInfiniteGrid } from '@/features/anime/components/discovery-infinite-grid';

/** Populares: agregación en vivo de proveedores externos (`GET /popular`). Sin filtros — la API no los soporta acá. */
function PopularPageClient() {
  const query = usePopularInfiniteQuery();
  const results = query.data?.pages.flat() ?? [];

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

export { PopularPageClient };
