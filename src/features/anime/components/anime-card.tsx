'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PlayIcon, StarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AnimeCover } from '@/features/anime/components/anime-cover';
import { Badge } from '@/components/ui/badge';
import { fetchAnimeById } from '@/features/anime/api/http-client';
import { animeKeys } from '@/features/anime/api/queries';
import { statusLabel, statusVariant } from '@/features/anime/status';
import type { AnimeSummary } from '@/features/anime/api/types';

export interface AnimeCardProps {
  anime: AnimeSummary;
  className?: string;
}

/** Card de anime del catálogo interno — usada en grids, carruseles y resultados de búsqueda. */
function AnimeCard({ anime, className }: AnimeCardProps) {
  const queryClient = useQueryClient();

  return (
    <Link
      href={`/anime/${anime.id}`}
      onMouseEnter={() => {
        // Optimización de navegación: al hacer hover ya se dispara el fetch
        // del detalle, así que al hacer click casi siempre está en cache.
        void queryClient.prefetchQuery({
          queryKey: animeKeys.detail(anime.id),
          queryFn: () => fetchAnimeById(anime.id),
          staleTime: 60_000,
        });
      }}
      className={cn(
        'group focus-visible:ring-ring/50 flex w-full flex-col gap-2 rounded-lg outline-none focus-visible:ring-3',
        className,
      )}
    >
      <AnimeCover
        animeId={anime.id}
        thumbnailUrl={anime.thumbnailUrl}
        alt={anime.title}
        label={anime.thumbnailUrl ? undefined : anime.title}
        overlay={
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="bg-background/90 text-foreground flex size-11 items-center justify-center rounded-full">
                <PlayIcon className="ml-0.5 size-5 fill-current" />
              </div>
            </div>
            <Badge variant={statusVariant(anime.status)} className="absolute top-2 left-2">
              {statusLabel(anime.status)}
            </Badge>
            {anime.rating ? (
              <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <StarIcon className="fill-warning text-warning size-3" />
                {anime.rating.score.toFixed(1)}
              </div>
            ) : null}
          </>
        }
      />
      <div className="flex flex-col gap-0.5">
        <h3 className="text-foreground line-clamp-1 text-sm font-medium">{anime.title}</h3>
        <p className="text-muted-foreground text-xs capitalize">{anime.type}</p>
      </div>
    </Link>
  );
}

export { AnimeCard };
