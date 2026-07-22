'use client';

import { CompassIcon } from 'lucide-react';

import { Grid } from '@/components/base/grid';
import { EmptyState } from '@/components/base/empty-state';
import { ErrorView } from '@/components/base/error-view';
import { InfiniteScrollTrigger } from '@/components/base/infinite-scroll-trigger';
import { DiscoveryCard } from '@/features/anime/components/discovery-card';
import { AnimeGridSkeleton } from '@/features/anime/components/skeletons';
import type { DiscoveryResult } from '@/features/anime/api/types';

export interface DiscoveryInfiniteGridProps {
  results: DiscoveryResult[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Grid con scroll infinito para resultados del Provider Framework (`/popular`, `/latest`, `/search`). */
function DiscoveryInfiniteGrid({
  results,
  isLoading,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyTitle = 'Sin resultados por ahora',
  emptyDescription = 'Los proveedores externos no devolvieron contenido. Vuelve a intentar más tarde.',
}: DiscoveryInfiniteGridProps) {
  if (isLoading) {
    return <AnimeGridSkeleton />;
  }

  if (isError) {
    return (
      <ErrorView
        title="No pudimos cargar este contenido"
        description="Ocurrió un problema al consultar a los proveedores externos."
        onRetry={onRetry}
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState icon={<CompassIcon className="size-6" />} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Grid columns="cards">
        {results.map((result, index) => (
          <DiscoveryCard key={`${result.title}-${index}`} result={result} />
        ))}
      </Grid>
      <InfiniteScrollTrigger
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}

export { DiscoveryInfiniteGrid };
