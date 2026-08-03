import { httpRequest, resolveApiBaseUrl, resolveMediaUrl } from '@/lib/http';
import type {
  AudioTrack,
  EpisodePlayback,
  EpisodeReference,
  PlaybackSession,
  PlaybackSource,
  ResumePoint,
  StreamQuality,
  Subtitle,
  WatchProgress,
} from '@/features/playback/api/types';

const API_BASE_URL = resolveApiBaseUrl();

// Formas crudas (snake_case) del backend.
interface RawAudioTrack {
  language_code: string;
  is_default: boolean;
}
interface RawSubtitle {
  language_code: string;
  format: string;
  url: string | null;
  is_default: boolean;
}
interface RawPlaybackSource {
  id: string;
  provider_id: string;
  server_name: string;
  url: string;
  quality: StreamQuality;
  audio: RawAudioTrack;
  subtitles: RawSubtitle[];
  is_active: boolean;
}
interface RawPlaybackMetadata {
  title: string;
  anime_title: string;
  /** Nuevo (backend): id del catálogo interno, incluso en el flujo externo (una vez ingerido vía el bridge) — permite armar `/next` real en vez del salto optimista ±1. */
  anime_id: string;
  season_number: number;
  episode_number: number;
  duration_seconds: number | null;
  thumbnail_url: string | null;
}
interface RawEpisodePlayback {
  episode_id: string;
  metadata: RawPlaybackMetadata;
  sources: RawPlaybackSource[];
  available_qualities: StreamQuality[];
}
interface RawEpisodeReference {
  anime_id: string;
  episode_id: string;
  season_number: number;
  episode_number: number;
}
interface RawWatchProgress {
  position_seconds: number;
  duration_seconds: number;
  percentage: number;
  updated_at: string;
}
interface RawPlaybackSession {
  id: string;
  episode_id: string;
  status: string;
  selected_source_id: string | null;
  selected_quality: StreamQuality | null;
  selected_subtitle_language_code: string | null;
  progress: RawWatchProgress | null;
  started_at: string;
  updated_at: string;
}
interface RawResumePoint {
  position_seconds: number;
  is_completed: boolean;
}

function mapAudioTrack(raw: RawAudioTrack): AudioTrack {
  return { languageCode: raw.language_code, isDefault: raw.is_default };
}

function mapSubtitle(raw: RawSubtitle): Subtitle {
  return {
    languageCode: raw.language_code,
    format: raw.format,
    url: raw.url,
    isDefault: raw.is_default,
  };
}

function mapSource(raw: RawPlaybackSource): PlaybackSource {
  return {
    id: raw.id,
    providerId: raw.provider_id,
    serverName: raw.server_name,
    url: raw.url,
    quality: raw.quality,
    audio: mapAudioTrack(raw.audio),
    subtitles: raw.subtitles.map(mapSubtitle),
    isActive: raw.is_active,
  };
}

function mapEpisodePlayback(raw: RawEpisodePlayback): EpisodePlayback {
  return {
    episodeId: raw.episode_id,
    metadata: {
      title: raw.metadata.title,
      animeTitle: raw.metadata.anime_title,
      animeId: raw.metadata.anime_id,
      seasonNumber: raw.metadata.season_number,
      episodeNumber: raw.metadata.episode_number,
      durationSeconds: raw.metadata.duration_seconds,
      thumbnailUrl: resolveMediaUrl(raw.metadata.thumbnail_url),
    },
    sources: raw.sources.map(mapSource),
    availableQualities: raw.available_qualities,
  };
}

function mapEpisodeReference(raw: RawEpisodeReference): EpisodeReference {
  return {
    animeId: raw.anime_id,
    episodeId: raw.episode_id,
    seasonNumber: raw.season_number,
    episodeNumber: raw.episode_number,
  };
}

function mapProgress(raw: RawWatchProgress): WatchProgress {
  return {
    positionSeconds: raw.position_seconds,
    durationSeconds: raw.duration_seconds,
    percentage: raw.percentage,
    updatedAt: raw.updated_at,
  };
}

function mapSession(raw: RawPlaybackSession): PlaybackSession {
  return {
    id: raw.id,
    episodeId: raw.episode_id,
    status: raw.status,
    selectedSourceId: raw.selected_source_id,
    selectedQuality: raw.selected_quality,
    selectedSubtitleLanguageCode: raw.selected_subtitle_language_code,
    progress: raw.progress ? mapProgress(raw.progress) : null,
    startedAt: raw.started_at,
    updatedAt: raw.updated_at,
  };
}

/** GET /animes/:animeId/episodes/:episodeId/playback — metadata + fuentes + calidades disponibles. */
export async function fetchEpisodePlayback(
  animeId: string,
  episodeId: string,
  preferredQuality?: StreamQuality,
): Promise<EpisodePlayback> {
  // `API_BASE_URL` es relativa (`/api/v1`) — `new URL()` exige una URL
  // absoluta o un `base` explícito, si no lanza `TypeError: Invalid URL` de
  // inmediato (antes de cualquier fetch real, sin dejar rastro en Network ni
  // en consola). El resto del cliente pasa el string relativo directo a
  // `httpRequest`/`fetch`, que sí lo resuelve bien contra el origin actual.
  let path = `${API_BASE_URL}/animes/${encodeURIComponent(animeId)}/episodes/${encodeURIComponent(episodeId)}/playback`;
  if (preferredQuality) path += `?preferred_quality=${encodeURIComponent(preferredQuality)}`;
  const raw = await httpRequest<RawEpisodePlayback>(path);
  return mapEpisodePlayback(raw);
}

/**
 * GET /anime/external/:providerId/:externalId/episodes/:episodeNumber/playback — reemplaza el
 * flujo de "ingerir la serie completa y navegar a la ficha" para clicks sobre un resultado de
 * `/latest` (que ya trae provider_id + external_id + episode_number en `sources[]`): en una sola
 * llamada resuelve metadata + fuentes reproducibles del episodio exacto. 404 real si el anime o el
 * episodio no existen en el provider.
 */
export async function fetchExternalEpisodePlayback(
  providerId: string,
  externalId: string,
  episodeNumber: number,
): Promise<EpisodePlayback> {
  const path = `${API_BASE_URL}/anime/external/${encodeURIComponent(providerId)}/${encodeURIComponent(externalId)}/episodes/${episodeNumber}/playback`;
  const raw = await httpRequest<RawEpisodePlayback>(path);
  return mapEpisodePlayback(raw);
}

/** GET .../seasons/:seasonNumber/episodes/:episodeNumber/next — null si es el último episodio. */
export async function fetchNextEpisode(
  animeId: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodeReference | null> {
  const raw = await httpRequest<RawEpisodeReference | null>(
    `${API_BASE_URL}/animes/${encodeURIComponent(animeId)}/seasons/${seasonNumber}/episodes/${episodeNumber}/next`,
  );
  return raw ? mapEpisodeReference(raw) : null;
}

/** GET .../seasons/:seasonNumber/episodes/:episodeNumber/previous — null si es el primer episodio. */
export async function fetchPreviousEpisode(
  animeId: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodeReference | null> {
  const raw = await httpRequest<RawEpisodeReference | null>(
    `${API_BASE_URL}/animes/${encodeURIComponent(animeId)}/seasons/${seasonNumber}/episodes/${episodeNumber}/previous`,
  );
  return raw ? mapEpisodeReference(raw) : null;
}

/** POST /playback/sessions — sesión anónima (no requiere sesión de usuario, ver docs/playback-integration.md). */
export async function createPlaybackSession(episodeId: string): Promise<PlaybackSession> {
  const raw = await httpRequest<RawPlaybackSession>(`${API_BASE_URL}/playback/sessions`, {
    method: 'POST',
    body: { episode_id: episodeId },
  });
  return mapSession(raw);
}

export async function selectPlaybackSource(
  sessionId: string,
  sourceId: string,
): Promise<PlaybackSession> {
  const raw = await httpRequest<RawPlaybackSession>(
    `${API_BASE_URL}/playback/sessions/${encodeURIComponent(sessionId)}/source`,
    { method: 'POST', body: { source_id: sourceId } },
  );
  return mapSession(raw);
}

export async function selectPlaybackQuality(
  sessionId: string,
  quality: StreamQuality,
): Promise<PlaybackSession> {
  const raw = await httpRequest<RawPlaybackSession>(
    `${API_BASE_URL}/playback/sessions/${encodeURIComponent(sessionId)}/quality`,
    { method: 'POST', body: { quality } },
  );
  return mapSession(raw);
}

/** `languageCode: null` limpia el subtítulo seleccionado ("Ninguno"). */
export async function selectPlaybackSubtitle(
  sessionId: string,
  languageCode: string | null,
  languageName: string | null,
): Promise<PlaybackSession> {
  const raw = await httpRequest<RawPlaybackSession>(
    `${API_BASE_URL}/playback/sessions/${encodeURIComponent(sessionId)}/subtitle`,
    { method: 'POST', body: { language_code: languageCode, language_name: languageName } },
  );
  return mapSession(raw);
}

export async function savePlaybackProgress(
  sessionId: string,
  positionSeconds: number,
  durationSeconds: number,
): Promise<PlaybackSession> {
  const raw = await httpRequest<RawPlaybackSession>(
    `${API_BASE_URL}/playback/sessions/${encodeURIComponent(sessionId)}/progress`,
    {
      method: 'POST',
      body: {
        position_seconds: Math.round(positionSeconds),
        duration_seconds: Math.round(durationSeconds),
      },
    },
  );
  return mapSession(raw);
}

export async function fetchPlaybackResumePoint(sessionId: string): Promise<ResumePoint> {
  const raw = await httpRequest<RawResumePoint>(
    `${API_BASE_URL}/playback/sessions/${encodeURIComponent(sessionId)}/resume-point`,
  );
  return { positionSeconds: raw.position_seconds, isCompleted: raw.is_completed };
}
