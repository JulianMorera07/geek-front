'use client';

import * as React from 'react';

import {
  useEpisodePlaybackQuery,
  useNextEpisodeQuery,
  usePreviousEpisodeQuery,
} from '@/features/playback/api/queries';
import { useAnimeEpisodesQuery } from '@/features/anime/api/queries';
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

  // Respaldo de duración para el aviso de "episodio terminado" cuando el
  // reproductor no la trae (habitual en fuentes externas) — la del catálogo
  // interno, real para animes ingestados desde jkanime (antes siempre null).
  const episodesQuery = useAnimeEpisodesQuery(animeId);
  const catalogEpisode = episodesQuery.data?.find((e) => e.id === episodeId);
  const durationSecondsHint = catalogEpisode?.durationMinutes
    ? catalogEpisode.durationMinutes * 60
    : null;

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
      durationSecondsHint={durationSecondsHint}
    />
  );
}

export { WatchPageClient };
