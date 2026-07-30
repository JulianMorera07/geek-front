'use client';

import {
  useEpisodePlaybackQuery,
  useNextEpisodeQuery,
  usePreviousEpisodeQuery,
} from '@/features/playback/api/queries';
import { EpisodePlayer } from '@/features/playback/components/episode-player';

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
