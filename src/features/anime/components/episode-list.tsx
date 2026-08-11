'use client';

import { ClapperboardIcon } from 'lucide-react';

import { EmptyState } from '@/components/base/empty-state';
import { ErrorView } from '@/components/base/error-view';
import { useAnimeEpisodesQuery } from '@/features/anime/api/queries';
import { EpisodeRangeAccordion } from '@/features/anime/components/episode-range-accordion';
import { EpisodeListSkeleton } from '@/features/anime/components/skeletons';
import { useContinueWatchingEntry } from '@/features/playback/hooks/use-continue-watching-entry';

export interface EpisodeListProps {
  animeId: string;
  animeThumbnailUrl?: string | null;
  pageSize?: number;
}

/**
 * Lista de episodios de un anime, agrupada en tramos por acordeón (ver
 * `EpisodeRangeAccordion`) en vez de paginación numerada. El backend
 * (`GET /anime/:id/episodes`) pagina la respuesta, pero `fetchAnimeEpisodes`
 * ya trae todas las páginas concatenadas antes de llegar acá.
 */
function EpisodeList({ animeId, animeThumbnailUrl, pageSize = 50 }: Readonly<EpisodeListProps>) {
  const query = useAnimeEpisodesQuery(animeId);
  const continueWatching = useContinueWatchingEntry(animeId);

  if (query.isPending) {
    return <EpisodeListSkeleton count={12} />;
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

  return (
    <EpisodeRangeAccordion
      animeId={animeId}
      episodes={query.data}
      animeThumbnailUrl={animeThumbnailUrl}
      chunkSize={pageSize}
      currentEpisodeNumber={continueWatching?.episodeNumber}
    />
  );
}

export { EpisodeList };
