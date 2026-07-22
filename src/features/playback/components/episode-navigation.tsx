import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { EpisodeReference } from '@/features/playback/api/types';

export interface EpisodeNavigationProps {
  previous?: EpisodeReference | null;
  next?: EpisodeReference | null;
}

/** Navegación entre episodios adyacentes — oculta el lado que no existe (primer/último episodio). */
function EpisodeNavigation({ previous, next }: EpisodeNavigationProps) {
  if (!previous && !next) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      {previous ? (
        <Button
          variant="outline"
          render={<Link href={`/anime/${previous.animeId}/watch/${previous.episodeId}`} />}
        >
          <ChevronLeftIcon />
          Episodio anterior
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button render={<Link href={`/anime/${next.animeId}/watch/${next.episodeId}`} />}>
          Siguiente episodio
          <ChevronRightIcon />
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}

export { EpisodeNavigation };
