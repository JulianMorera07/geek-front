import Link from 'next/link';

import { cn } from '@/lib/utils';
import { seedToGradient } from '@/lib/placeholder';
import type { Genre } from '@/features/anime/api/types';

export interface GenreCardProps {
  genre: Genre;
  /** Cantidad de animes en este género (opcional, informativo). */
  count?: number;
  className?: string;
}

/** Card compacta de género — usada en el grid de géneros y en la home. */
function GenreCard({ genre, count, className }: GenreCardProps) {
  return (
    <Link
      href={`/genre/${genre.id}`}
      style={{ backgroundImage: seedToGradient(genre.id) }}
      className={cn(
        'group focus-visible:ring-ring/50 relative flex aspect-video items-end overflow-hidden rounded-lg p-3 transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-3',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="relative flex flex-col gap-0.5 text-white">
        <span className="font-heading text-sm font-semibold">{genre.name}</span>
        {typeof count === 'number' ? (
          <span className="text-xs opacity-80">{count} animes</span>
        ) : null}
      </div>
    </Link>
  );
}

export { GenreCard };
