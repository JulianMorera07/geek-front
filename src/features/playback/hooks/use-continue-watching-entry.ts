'use client';

import * as React from 'react';

import { useAuth } from '@/features/auth/use-auth';
import { authSessionManager } from '@/features/auth/session-manager';
import { useContinueWatchingQuery } from '@/features/playback/api/queries';
import {
  getContinueWatching,
  type ContinueWatchingEntry,
} from '@/features/playback/continue-watching-storage';

export interface ContinueWatchingDisplayEntry {
  href: string;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Progreso guardado para UN anime puntual — misma prioridad remoto > local que
 * usa `ContinueWatchingBanner`: con sesión, el backend manda si tiene algo
 * para este anime (`GET /playback/continue-watching` filtrado por `animeId`);
 * si no (sin sesión, o logueado pero sin progreso acá todavía), se cae al
 * respaldo anónimo en `localStorage` — nunca se oculta el rastro local solo
 * por haber iniciado sesión. Cada anime tiene su propia entrada en
 * `localStorage` (keyed por `animeId`), así que ver varios animes en paralelo
 * no pisa el progreso de ninguno.
 *
 * Extraído del banner para reusarlo también marcando el episodio actual en el
 * listado (`EpisodeList`/`SeasonEpisodeList`).
 */
export function useContinueWatchingEntry(animeId: string): ContinueWatchingDisplayEntry | null {
  const { isAuthenticated } = useAuth();
  const remoteQuery = useContinueWatchingQuery(
    isAuthenticated ? authSessionManager.getAccessToken() : null,
  );

  const [localEntry, setLocalEntry] = React.useState<ContinueWatchingEntry | null>(null);
  React.useEffect(() => {
    setLocalEntry(getContinueWatching(animeId));
  }, [animeId]);

  const remoteMatch = remoteQuery.data?.find((e) => e.animeId === animeId);
  // Gap visto en vivo (2026-08-18): el backend a veces manda la entrada de
  // `/playback/continue-watching` sin `season_number`/`episode_number` (el
  // registro de sesión quedó incompleto de ese lado) — sin esta validación se
  // veía "T· Ep." en blanco en vez de caer al respaldo local, que sí tiene
  // los números completos.
  const remoteMatchIsComplete =
    remoteMatch !== undefined &&
    Number.isFinite(remoteMatch.seasonNumber) &&
    Number.isFinite(remoteMatch.episodeNumber);
  const remoteEntry: ContinueWatchingDisplayEntry | null =
    isAuthenticated && remoteMatchIsComplete
      ? {
          href: `/anime/${animeId}/watch/${remoteMatch.episodeId}`,
          seasonNumber: remoteMatch.seasonNumber,
          episodeNumber: remoteMatch.episodeNumber,
        }
      : null;

  return remoteEntry ?? localEntry;
}
