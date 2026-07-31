'use client';

import * as React from 'react';

import {
  useEpisodePlaybackQuery,
  useNextEpisodeQuery,
  usePreviousEpisodeQuery,
} from '@/features/playback/api/queries';
import { EpisodePlayer } from '@/features/playback/components/episode-player';
import { storeContinueWatching } from '@/features/playback/continue-watching-storage';

export interface WatchPageClientProps {
  animeId: string;
  episodeId: string;
}

/** Reproducción de un episodio del catálogo interno, con navegación entre episodios adyacentes. */
function WatchPageClient({ animeId, episodeId }: WatchPageClientProps) {
  const playbackQuery = useEpisodePlaybackQuery(animeId, episodeId);
  const metadata = playbackQuery.data?.metadata;
  const nextQuery = useNextEpisodeQuery(animeId, metadata?.seasonNumber, metadata?.episodeNumber);
  const previousQuery = usePreviousEpisodeQuery(
    animeId,
    metadata?.seasonNumber,
    metadata?.episodeNumber,
  );

  // Registra "último episodio visto" por anime — lo que le permite a
  // `ContinueWatchingBanner` (en la ficha del anime) mostrar "ibas por T1 ·
  // Ep. 5" sin que el usuario haya vuelto a entrar al reproductor todavía.
  React.useEffect(() => {
    if (!metadata) return;
    storeContinueWatching(animeId, {
      episodeId,
      seasonNumber: metadata.seasonNumber,
      episodeNumber: metadata.episodeNumber,
    });
  }, [animeId, episodeId, metadata]);

  return (
    <EpisodePlayer
      watchKey={episodeId}
      playbackQuery={playbackQuery}
      previous={previousQuery.data}
      next={nextQuery.data}
    />
  );
}

export { WatchPageClient };
