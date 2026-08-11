'use client';

import Link from 'next/link';
import { PlayIcon, SkipForwardIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import { useNextEpisodeQuery } from '@/features/playback/api/queries';
import { useContinueWatchingEntry } from '@/features/playback/hooks/use-continue-watching-entry';

export interface ContinueWatchingBannerProps {
  animeId: string;
}

/**
 * Aviso en la ficha del anime: "ibas por T1 · Ep. 5" con acceso directo a
 * retomar ese episodio o pasar al siguiente. Progreso resuelto por
 * `useContinueWatchingEntry` (remoto si hay sesión, local si no o si el
 * backend no trae nada para este anime puntual — ver ese hook para el detalle
 * de prioridad entre las dos fuentes).
 */
function ContinueWatchingBanner({ animeId }: Readonly<ContinueWatchingBannerProps>) {
  const entry = useContinueWatchingEntry(animeId);
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
