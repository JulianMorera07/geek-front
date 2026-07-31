import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Heading } from '@/components/base/typography';
import type { AnimeSummary } from '@/features/anime/api/types';

export interface OngoingListProps {
  animes: AnimeSummary[];
  className?: string;
}

/** Lista lateral compacta de series en emisión — solo nombre + link, acompaña al carrusel principal de la Home. */
function OngoingList({ animes, className }: Readonly<OngoingListProps>) {
  if (animes.length === 0) return null;

  return (
    <aside className={cn('flex flex-col gap-3', className)}>
      <Heading level="h3">En emisión</Heading>
      <ul className="flex flex-col gap-0.5 overflow-y-auto lg:max-h-[420px]">
        {animes.map((anime) => (
          <li key={anime.id}>
            <Link
              href={`/anime/${anime.id}`}
              className="text-muted-foreground hover:text-foreground hover:bg-accent block truncate rounded-md px-2 py-1.5 text-sm transition-colors"
            >
              {anime.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { OngoingList };
