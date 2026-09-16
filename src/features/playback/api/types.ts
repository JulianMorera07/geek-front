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
  /** Solo lógica interna (ej. mandarlo de vuelta en `POST /playback/sources/select`) — NUNCA pintarlo en pantalla, ver `providerDisplayName`. */
  providerId: string;
  /** Nombre de marca del proveedor pensado para mostrar (ej. "Kitsune", "Ronin", "Sakura") — agrupa las pestañas del selector, a diferencia de `providerId`. */
  providerDisplayName: string;
  serverName: string;
  url: string;
  /**
   * URL del archivo de video real (mp4/m3u8), best-effort — el backend la
   * resuelve vía yt-dlp cuando el proveedor lo permite (voe.sx, mixdrop,
   * ok.ru, streamsb; nunca mega.nz ni yourupload). `null` no es un error: es
   * el caso normal cuando el proveedor no lo permite o cambió su ofuscación.
   * Cuando existe, da control real (seek, saltar op/ed, fin exacto) vía un
   * `<video>` propio en vez del `<iframe>` de siempre.
   */
  directUrl: string | null;
  quality: StreamQuality;
  audio: AudioTrack;
  subtitles: Subtitle[];
  isActive: boolean;
}

/**
 * Tramo de intro (`op`) u outro/ending (`ed`) detectado por AniSkip. Un
 * array vacío NO significa que el episodio no tenga — significa que todavía
 * no hay dato para ese episodio puntual (cobertura floja en estrenos
 * recientes). No usar para inferir ausencia de intro/outro.
 */
export interface SkipInterval {
  kind: 'op' | 'ed';
  startSeconds: number;
  endSeconds: number;
}

export interface PlaybackMetadata {
  title: string;
  animeTitle: string;
  /** Id del catálogo interno — presente incluso en el flujo externo una vez el anime fue ingerido vía el bridge. */
  animeId: string;
  seasonNumber: number;
  episodeNumber: number;
  /**
   * Puede variar levemente entre episodios de la misma serie (antes era un
   * valor fijo por serie) — más preciso ahora. `null` si ni AniSkip ni el
   * estimado de jkanime tienen dato para este episodio.
   */
  durationSeconds: number | null;
  skipIntervals: SkipInterval[];
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
 * `GET /playback/continue-watching` (requiere sesión) — progreso real del
 * usuario logueado, ligado a las sesiones de playback que crea con
 * `anime_id` + `Authorization`. Reemplaza el `localStorage` anónimo
 * (`continue-watching-storage.ts`) cuando hay sesión, que sigue siendo el
 * respaldo para usuarios sin cuenta.
 */
export interface ContinueWatchingRemoteEntry {
  animeId: string;
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  animeTitle: string | null;
  thumbnailUrl: string | null;
  updatedAt: string | null;
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
