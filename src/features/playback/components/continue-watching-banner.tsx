'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlayIcon, SkipForwardIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import { useNextEpisodeQuery } from '@/features/playback/api/queries';
import {
  getContinueWatching,
  type ContinueWatchingEntry,
} from '@/features/playback/continue-watching-storage';

export interface ContinueWatchingBannerProps {
  animeId: string;
}

/**
 * Aviso en la ficha del anime: "ibas por T1 · Ep. 5" con acceso directo a
 * retomar ese episodio o pasar al siguiente, sin tener que buscar el
 * episodio a mano de nuevo. Lee `localStorage` en un efecto (no en el
 * inicializador de `useState`) — mismo motivo que en el resto del
 * reproductor: evita el mismatch de hidratación SSR/cliente (error #418).
 */
function ContinueWatchingBanner({ animeId }: Readonly<ContinueWatchingBannerProps>) {
  const [entry, setEntry] = React.useState<ContinueWatchingEntry | null>(null);

  React.useEffect(() => {
    setEntry(getContinueWatching(animeId));
  }, [animeId]);

  const nextQuery = useNextEpisodeQuery(animeId, entry?.seasonNumber, entry?.episodeNumber);

  if (!entry) return null;

  return (
    <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <Text>
        Ibas por T{entry.seasonNumber} · Ep. {entry.episodeNumber}
      </Text>
      <div className="flex gap-2">
        <Button size="sm" render={<Link href={`/anime/${animeId}/watch/${entry.episodeId}`} />}>
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
