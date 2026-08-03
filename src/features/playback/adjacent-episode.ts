import type { AdjacentEpisode, EpisodeReference } from '@/features/playback/api/types';

/** `EpisodeReference` (respuesta cruda de `/next`/`/previous`) → `AdjacentEpisode` (con `href` ya resuelto), usado tanto por el flujo interno como el externo una vez que este último también resuelve `animeId`. */
export function toAdjacentEpisode(ref: EpisodeReference | undefined | null): AdjacentEpisode | null {
  if (!ref) return null;
  return {
    href: `/anime/${ref.animeId}/watch/${ref.episodeId}`,
    seasonNumber: ref.seasonNumber,
    episodeNumber: ref.episodeNumber,
  };
}
