'use client';

import { useExternalEpisodePlaybackQuery } from '@/features/playback/api/queries';
import { EpisodePlayer } from '@/features/playback/components/episode-player';

export interface ExternalWatchPageClientProps {
  providerId: string;
  externalId: string;
  episodeNumber: number;
}

/**
 * Reproducción directa de un episodio a partir de un resultado de `/latest`
 * (provider_id + external_id + episode_number), sin pasar primero por la
 * ficha del anime. Sin `animeId` interno no hay cómo resolver episodios
 * adyacentes — `EpisodePlayer` oculta esa navegación cuando no se le pasan.
 */
function ExternalWatchPageClient({
  providerId,
  externalId,
  episodeNumber,
}: ExternalWatchPageClientProps) {
  const playbackQuery = useExternalEpisodePlaybackQuery(providerId, externalId, episodeNumber);

  return (
    <EpisodePlayer
      watchKey={`${providerId}:${externalId}:${episodeNumber}`}
      playbackQuery={playbackQuery}
    />
  );
}

export { ExternalWatchPageClient };
