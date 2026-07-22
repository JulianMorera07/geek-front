import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';

import { Carousel } from '@/components/base/carousel';
import { Heading } from '@/components/base/typography';
import { AnimeCard } from '@/features/anime/components/anime-card';
import type { AnimeSummary } from '@/features/anime/api/types';

export interface AnimeRowProps {
  title: string;
  animes: AnimeSummary[];
  /** Link a la vista completa (ej. /popular, /latest, /genre/[slug]). */
  viewAllHref?: string;
}

/** Fila horizontal de animes con carrusel — bloque base de la Home. */
function AnimeRow({ title, animes, viewAllHref }: AnimeRowProps) {
  if (animes.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Heading level="h3">{title}</Heading>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"
          >
            Ver todo
            <ChevronRightIcon className="size-4" />
          </Link>
        ) : null}
      </div>
      <Carousel>
        {animes.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} className="w-36 shrink-0 snap-start sm:w-44" />
        ))}
      </Carousel>
    </section>
  );
}

export { AnimeRow };
