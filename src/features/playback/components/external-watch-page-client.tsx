'use client';

import * as React from 'react';

import {
  useExternalEpisodePlaybackQuery,
  useNextEpisodeQuery,
  usePreviousEpisodeQuery,
} from '@/features/playback/api/queries';
import { EpisodePlayer } from '@/features/playback/components/episode-player';
import { storeContinueWatching } from '@/features/playback/continue-watching-storage';
import { toAdjacentEpisode } from '@/features/playback/adjacent-episode';

export interface ExternalWatchPageClientProps {
  providerId: string;
  externalId: string;
  episodeNumber: number;
}

/**
 * Reproducción directa de un episodio a partir de un resultado de `/latest`
 * (provider_id + external_id + episode_number), sin pasar primero por la
 * ficha del anime. El backend ahora informa `metadata.animeId` (el anime
 * queda ingerido al primer playback) — con eso se arma `previous`/`next`
 * contra los mismos endpoints reales del catálogo interno (`/next`,
 * `/previous`), en vez de adivinar ±1 sobre el número de episodio sin forma
 * de confirmar si de verdad existía.
 *
 * El progreso también se guarda bajo la clave del `animeId` interno (no por
 * provider+externalId) — así queda unificado con el flujo interno: si el
 * usuario después entra a la ficha del anime, `ContinueWatchingBanner`
 * refleja el episodio visto acá, y viceversa.
 */
function ExternalWatchPageClient({
  providerId,
  externalId,
  episodeNumber,
}: Readonly<ExternalWatchPageClientProps>) {
  const playbackQuery = useExternalEpisodePlaybackQuery(providerId, externalId, episodeNumber);
  const metadata = playbackQuery.data?.metadata;
  const episodeId = playbackQuery.data?.episodeId;

  const nextQuery = useNextEpisodeQuery(
    metadata?.animeId ?? '',
    metadata?.seasonNumber,
    metadata?.episodeNumber,
  );
  const previousQuery = usePreviousEpisodeQuery(
    metadata?.animeId ?? '',
    metadata?.seasonNumber,
    metadata?.episodeNumber,
  );

  React.useEffect(() => {
    if (!metadata || !episodeId) return;
    storeContinueWatching(metadata.animeId, {
      animeTitle: metadata.animeTitle,
      thumbnailUrl: metadata.thumbnailUrl,
      href: `/anime/${metadata.animeId}/watch/${episodeId}`,
      seasonNumber: metadata.seasonNumber,
      episodeNumber: metadata.episodeNumber,
    });
  }, [metadata, episodeId]);

  return (
    <EpisodePlayer
      watchKey={`${providerId}:${externalId}:${episodeNumber}`}
      playbackQuery={playbackQuery}
      previous={toAdjacentEpisode(previousQuery.data)}
      next={toAdjacentEpisode(nextQuery.data)}
    />
  );
}

export { ExternalWatchPageClient };
