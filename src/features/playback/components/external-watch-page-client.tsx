'use client';

import * as React from 'react';

import { useExternalEpisodePlaybackQuery } from '@/features/playback/api/queries';
import { EpisodePlayer } from '@/features/playback/components/episode-player';
import { storeContinueWatching } from '@/features/playback/continue-watching-storage';
import type { AdjacentEpisode } from '@/features/playback/api/types';

export interface ExternalWatchPageClientProps {
  providerId: string;
  externalId: string;
  episodeNumber: number;
}

function externalEpisodeHref(providerId: string, externalId: string, episodeNumber: number): string {
  return `/watch/external/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}/${episodeNumber}`;
}

/**
 * Reproducción directa de un episodio a partir de un resultado de `/latest`
 * (provider_id + external_id + episode_number), sin pasar primero por la
 * ficha del anime. Sin `animeId` interno no hay endpoint que confirme si el
 * episodio siguiente/anterior existe de verdad — a diferencia del flujo
 * interno, acá `previous`/`next` se arman de forma optimista (± 1 sobre el
 * número actual). Si no existe, el reproductor de destino cae en el mismo
 * `ErrorView` de "Episodio no encontrado" que ya maneja `EpisodePlayer` —
 * mismo trade-off aceptado que el estimado de duración genérico.
 */
function ExternalWatchPageClient({
  providerId,
  externalId,
  episodeNumber,
}: Readonly<ExternalWatchPageClientProps>) {
  const playbackQuery = useExternalEpisodePlaybackQuery(providerId, externalId, episodeNumber);
  const metadata = playbackQuery.data?.metadata;

  const previous: AdjacentEpisode | null =
    episodeNumber > 1
      ? {
          href: externalEpisodeHref(providerId, externalId, episodeNumber - 1),
          seasonNumber: metadata?.seasonNumber ?? 1,
          episodeNumber: episodeNumber - 1,
        }
      : null;
  const next: AdjacentEpisode = {
    href: externalEpisodeHref(providerId, externalId, episodeNumber + 1),
    seasonNumber: metadata?.seasonNumber ?? 1,
    episodeNumber: episodeNumber + 1,
  };

  // Registra "último episodio visto" por serie externa (misma idea que el
  // flujo interno, ver `WatchPageClient`) — clave por provider+externalId ya
  // que acá no hay `animeId` de catálogo.
  React.useEffect(() => {
    if (!metadata) return;
    storeContinueWatching(`${providerId}:${externalId}`, {
      animeTitle: metadata.animeTitle,
      thumbnailUrl: metadata.thumbnailUrl,
      href: externalEpisodeHref(providerId, externalId, episodeNumber),
      seasonNumber: metadata.seasonNumber,
      episodeNumber: metadata.episodeNumber,
    });
  }, [providerId, externalId, episodeNumber, metadata]);

  return (
    <EpisodePlayer
      watchKey={`${providerId}:${externalId}:${episodeNumber}`}
      playbackQuery={playbackQuery}
      previous={previous}
      next={next}
    />
  );
}

export { ExternalWatchPageClient };
