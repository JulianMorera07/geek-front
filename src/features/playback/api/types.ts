/** Tipos mapeados (camelCase) desde `playback_schemas.py` del backend. Sin autenticación — sesiones anónimas. */

/** Enum real del backend (`StreamQuality`) — no aceptar valores libres como "1080p". */
export type StreamQuality = 'sd' | 'hd' | 'fhd' | 'uhd';

export interface AudioTrack {
  languageCode: string;
  isDefault: boolean;
}

export interface Subtitle {
  languageCode: string;
  format: string;
  url: string | null;
  isDefault: boolean;
}

export interface PlaybackSource {
  id: string;
  providerId: string;
  serverName: string;
  url: string;
  quality: StreamQuality;
  audio: AudioTrack;
  subtitles: Subtitle[];
  isActive: boolean;
}

export interface PlaybackMetadata {
  title: string;
  animeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface EpisodePlayback {
  episodeId: string;
  metadata: PlaybackMetadata;
  sources: PlaybackSource[];
  availableQualities: StreamQuality[];
}

export interface EpisodeReference {
  animeId: string;
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Forma genérica para "episodio adyacente" que usan `EpisodeNavigation` y
 * `NextEpisodePrompt` — a diferencia de `EpisodeReference` (que exige
 * `animeId`/`episodeId` del catálogo interno), `href` ya viene resuelto por
 * quien arma el dato, así sirve tanto para el flujo interno
 * (`/anime/:animeId/watch/:episodeId`) como para el externo
 * (`/watch/external/:providerId/:externalId/:episodeNumber`).
 */
export interface AdjacentEpisode {
  href: string;
  seasonNumber: number;
  episodeNumber: number;
}

export interface WatchProgress {
  positionSeconds: number;
  durationSeconds: number;
  percentage: number;
  updatedAt: string;
}

export interface ResumePoint {
  positionSeconds: number;
  isCompleted: boolean;
}

export interface PlaybackSession {
  id: string;
  episodeId: string;
  status: string;
  selectedSourceId: string | null;
  selectedQuality: StreamQuality | null;
  selectedSubtitleLanguageCode: string | null;
  progress: WatchProgress | null;
  startedAt: string;
  updatedAt: string;
}
