'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import { useAuth } from '@/features/auth/use-auth';
import { authSessionManager } from '@/features/auth/session-manager';
import { useContinueWatchingQuery } from '@/features/playback/api/queries';
import { getMostRecentContinueWatching } from '@/features/playback/continue-watching-storage';

interface DisplayEntry {
  href: string;
  animeTitle: string;
  thumbnailUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Aviso al llegar a la Home: "ibas viendo X — T1 Ep. 5". Con sesión iniciada,
 * prioriza `GET /playback/continue-watching` (progreso real del backend, la
 * más reciente entre todas las series); si no hay sesión, o el backend
 * todavía no trae nada para el usuario logueado, cae al respaldo anónimo en
 * `localStorage` — las dos fuentes se mantienen, nunca se oculta el rastro
 * local solo por haber iniciado sesión.
 */
function HomeContinueWatchingBanner() {
  const { isAuthenticated } = useAuth();
  const remoteQuery = useContinueWatchingQuery(
    isAuthenticated ? authSessionManager.getAccessToken() : null,
  );

  const [localEntry, setLocalEntry] = React.useState<DisplayEntry | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  // Lee `localStorage` en un efecto, no en el inicializador de `useState` —
  // mismo motivo que el resto del reproductor: evita el mismatch de
  // hidratación SSR/cliente (error #418).
  React.useEffect(() => {
    const stored = getMostRecentContinueWatching();
    setLocalEntry(stored ? { ...stored } : null);
  }, []);

  const mostRecentRemote = [...(remoteQuery.data ?? [])].sort((a, b) =>
    (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  )[0];

  const remoteEntry: DisplayEntry | null =
    isAuthenticated && mostRecentRemote
      ? {
          href: `/anime/${mostRecentRemote.animeId}/watch/${mostRecentRemote.episodeId}`,
          animeTitle: mostRecentRemote.animeTitle ?? 'tu anime',
          thumbnailUrl: mostRecentRemote.thumbnailUrl,
          seasonNumber: mostRecentRemote.seasonNumber,
          episodeNumber: mostRecentRemote.episodeNumber,
        }
      : null;
  // El backend manda si hay algo que mostrar; si no (sin sesión, o logueado
  // pero sin progreso ahí todavía), se mantiene el respaldo local.
  const entry: DisplayEntry | null = remoteEntry ?? localEntry;

  if (!entry || dismissed) return null;

  return (
    <div className="bg-muted/40 flex items-center gap-4 rounded-xl border p-4">
      {entry.thumbnailUrl ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
          <Image src={entry.thumbnailUrl} alt={entry.animeTitle} fill className="object-cover" unoptimized />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text variant="muted">Continuar viendo</Text>
        <Text className="truncate font-medium">{entry.animeTitle}</Text>
        <Text variant="muted">
          T{entry.seasonNumber} · Ep. {entry.episodeNumber}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" render={<Link href={entry.href} />}>
          <PlayIcon />
          Continuar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Ocultar
        </Button>
      </div>
    </div>
  );
}

export { HomeContinueWatchingBanner };
