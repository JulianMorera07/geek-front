'use client';

import { SearchXIcon } from 'lucide-react';

import { Grid } from '@/components/base/grid';
import { EmptyState } from '@/components/base/empty-state';
import { ErrorView } from '@/components/base/error-view';
import { InfiniteScrollTrigger } from '@/components/base/infinite-scroll-trigger';
import { AnimeCard } from '@/features/anime/components/anime-card';
import { AnimeGridSkeleton } from '@/features/anime/components/skeletons';
import type { AnimeSummary } from '@/features/anime/api/types';

export interface AnimeInfiniteGridProps {
  animes: AnimeSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Grid de animes con scroll infinito, conectado a la API mock vía React
 * Query (`useAnimesInfiniteQuery`). Cubre los 4 estados que toda lista
 * conectada a datos debe manejar: loading inicial, error (con retry),
 * vacío, y "cargando más" al fondo de la lista.
 */
function AnimeInfiniteGrid({
  animes,
  isLoading,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyTitle = 'No encontramos animes',
  emptyDescription = 'Prueba con otros filtros o términos de búsqueda.',
}: AnimeInfiniteGridProps) {
  if (isLoading) {
    return <AnimeGridSkeleton />;
  }

  if (isError) {
    return (
      <ErrorView
        title="No pudimos cargar los animes"
        description="Ocurrió un problema al consultar el catálogo."
        onRetry={onRetry}
      />
    );
  }

  if (animes.length === 0) {
    return (
      <EmptyState
        icon={<SearchXIcon className="size-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Grid columns="cards">
        {animes.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
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

export { AnimeInfiniteGrid };
