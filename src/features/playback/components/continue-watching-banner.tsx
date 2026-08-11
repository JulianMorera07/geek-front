'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlayIcon, SkipForwardIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import { useAuth } from '@/features/auth/use-auth';
import { authSessionManager } from '@/features/auth/session-manager';
import { useContinueWatchingQuery, useNextEpisodeQuery } from '@/features/playback/api/queries';
import {
  getContinueWatching,
  type ContinueWatchingEntry,
} from '@/features/playback/continue-watching-storage';

export interface ContinueWatchingBannerProps {
  animeId: string;
}

interface DisplayEntry {
  href: string;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Aviso en la ficha del anime: "ibas por T1 · Ep. 5" con acceso directo a
 * retomar ese episodio o pasar al siguiente. Con sesión iniciada, prioriza el
 * progreso real del backend (`GET /playback/continue-watching`, filtrado a
 * este `animeId`); si no hay sesión, o el backend no trae nada para este
 * anime puntual, cae al respaldo anónimo en `localStorage` — las dos fuentes
 * se mantienen, nunca se oculta el rastro local solo por haber iniciado
 * sesión. Lee `localStorage` en un efecto (no en el inicializador de
 * `useState`) — mismo motivo que en el resto del reproductor: evita el
 * mismatch de hidratación SSR/cliente (error #418).
 */
function ContinueWatchingBanner({ animeId }: Readonly<ContinueWatchingBannerProps>) {
  const { isAuthenticated } = useAuth();
  const remoteQuery = useContinueWatchingQuery(
    isAuthenticated ? authSessionManager.getAccessToken() : null,
  );

  const [localEntry, setLocalEntry] = React.useState<ContinueWatchingEntry | null>(null);
  React.useEffect(() => {
    setLocalEntry(getContinueWatching(animeId));
  }, [animeId]);

  const remoteMatch = remoteQuery.data?.find((e) => e.animeId === animeId);
  const remoteEntry: DisplayEntry | null =
    isAuthenticated && remoteMatch
      ? {
          href: `/anime/${animeId}/watch/${remoteMatch.episodeId}`,
          seasonNumber: remoteMatch.seasonNumber,
          episodeNumber: remoteMatch.episodeNumber,
        }
      : null;
  // El backend manda si hay algo que mostrar para este anime; si no (sin
  // sesión, o logueado pero sin progreso acá todavía), se mantiene el
  // respaldo local.
  const entry: DisplayEntry | null = remoteEntry ?? localEntry;

  const nextQuery = useNextEpisodeQuery(animeId, entry?.seasonNumber, entry?.episodeNumber);

  if (!entry) return null;

  return (
    <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <Text>
        Ibas por T{entry.seasonNumber} · Ep. {entry.episodeNumber}
      </Text>
      <div className="flex gap-2">
        <Button size="sm" render={<Link href={entry.href} />}>
          <PlayIcon />
          Continuar viendo
        </Button>
        {nextQuery.data ? (
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/anime/${animeId}/watch/${nextQuery.data.episodeId}`} />}
          >
            <SkipForwardIcon />
            Siguiente episodio
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { ContinueWatchingBanner };
