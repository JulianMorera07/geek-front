'use client';

import * as React from 'react';
import { ClapperboardIcon } from 'lucide-react';

import { Grid } from '@/components/base/grid';
import { Pagination } from '@/components/base/pagination';
import { EmptyState } from '@/components/base/empty-state';
import { ErrorView } from '@/components/base/error-view';
import { paginateArray } from '@/lib/paginate';
import { useAnimeEpisodesQuery } from '@/features/anime/api/queries';
import { EpisodeCard } from '@/features/anime/components/episode-card';
import { EpisodeListSkeleton } from '@/features/anime/components/skeletons';

export interface EpisodeListProps {
  animeId: string;
  animeThumbnailUrl?: string | null;
  pageSize?: number;
}

/**
 * Lista de episodios de un anime. El backend (`GET /anime/:id/episodes`)
 * siempre devuelve el listado completo (no pagina) — la paginación es
 * puramente de presentación en el cliente sobre el array ya cargado, no un
 * segundo fetch. Scroll infinito no aplica: no hay "página siguiente" que pedir.
 */
function EpisodeList({ animeId, animeThumbnailUrl, pageSize = 12 }: EpisodeListProps) {
  const [page, setPage] = React.useState(1);
  const query = useAnimeEpisodesQuery(animeId);

  if (query.isPending) {
    return <EpisodeListSkeleton count={pageSize} />;
  }

  if (query.isError) {
    return (
      <ErrorView
        title="No pudimos cargar los episodios"
        description="Ocurrió un problema al consultar el listado."
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={<ClapperboardIcon className="size-6" />}
        title="Todavía no hay episodios"
        description="Vuelve pronto — este contenido se actualiza seguido."
      />
    );
  }

  const { items, pageCount } = paginateArray(query.data, page, pageSize);

  return (
    <div className="flex flex-col gap-6">
      <Grid columns="wide">
        {items.map((episode) => (
          <EpisodeCard
            key={episode.id}
            animeId={animeId}
            episode={episode}
            animeThumbnailUrl={animeThumbnailUrl}
          />
        ))}
      </Grid>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}

export { EpisodeList };
