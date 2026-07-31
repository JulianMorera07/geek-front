'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import {
  getMostRecentContinueWatching,
  type ContinueWatchingEntry,
} from '@/features/playback/continue-watching-storage';

/**
 * Aviso al llegar a la Home: "ibas viendo X — T1 Ep. 5", tomando la serie
 * (interna o externa) con progreso más reciente entre todas las guardadas —
 * a diferencia de `ContinueWatchingBanner` (en la ficha de un anime puntual,
 * que ya sabe cuál serie es), acá no se sabe de antemano cuál fue la última.
 * Lee `localStorage` en un efecto, no en el inicializador de `useState`,
 * mismo motivo que el resto del reproductor: evita el mismatch de
 * hidratación SSR/cliente (error #418).
 */
function HomeContinueWatchingBanner() {
  const [entry, setEntry] = React.useState<ContinueWatchingEntry | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setEntry(getMostRecentContinueWatching());
  }, []);

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
