import Link from 'next/link';
import { CheckCircle2Icon, ClapperboardIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AnimeCover } from '@/features/anime/components/anime-cover';
import type { Episode } from '@/features/anime/api/types';

export interface EpisodeCardProps {
  animeId: string;
  episode: Episode;
  /** El backend nunca trae miniatura por episodio — se usa la portada del anime (real o cacheada). */
  animeThumbnailUrl?: string | null;
  className?: string;
  /** Es el episodio donde el usuario se quedó (ver `useContinueWatchingEntry`) — resalta la card y avisa "Quedaste aquí". */
  isCurrent?: boolean;
  /** Número de episodio menor al actual, según el mismo progreso guardado — se marca como visto (no hay tracking real por episodio, es inferido). */
  isWatched?: boolean;
}

function formatAirDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Card horizontal de episodio — enlaza a `/anime/:animeId/watch/:episodeId`.
 * El backend nunca trae miniatura propia por episodio (a diferencia del
 * anime, ni siquiera momentáneamente en `/search`) — se usa la portada del
 * anime como estand-in (real o cacheada vía `AnimeCover`), pedido
 * explícitamente así ("no importa" que se repita en todos los episodios).
 */
function EpisodeCard({
  animeId,
  episode,
  animeThumbnailUrl,
  className,
  isCurrent,
  isWatched,
}: Readonly<EpisodeCardProps>) {
  const thumbnail = episode.media.find((m) => m.kind === 'thumbnail' || m.kind === 'cover')?.url;
  const displayThumbnail = thumbnail ?? animeThumbnailUrl;
  const airDate = formatAirDate(episode.airDate);

  return (
    <Link
      href={`/anime/${animeId}/watch/${episode.id}`}
      className={cn(
        'hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none',
        isCurrent && 'bg-accent ring-primary ring-2',
        isWatched && !isCurrent && 'opacity-60',
        className,
      )}
    >
      <AnimeCover
        animeId={animeId}
        thumbnailUrl={displayThumbnail}
        alt={episode.title}
        ratio="video"
        className="w-32 text-xs"
        overlay={
          isWatched ? (
            <CheckCircle2Icon className="text-primary bg-background/80 absolute right-2 bottom-2 size-5 rounded-full" />
          ) : !displayThumbnail ? (
            <ClapperboardIcon className="absolute right-2 bottom-2 size-4 opacity-60" />
          ) : undefined
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h4 className="text-foreground line-clamp-1 text-sm font-medium">
            Ep. {episode.number} — {episode.title}
          </h4>
          {isCurrent ? (
            <Badge variant="default" className="shrink-0">
              Quedaste aquí
            </Badge>
          ) : isWatched ? (
            <Badge variant="secondary" className="shrink-0">
              Visto
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {[episode.durationMinutes ? `${episode.durationMinutes} min` : null, airDate]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  );
}

export { EpisodeCard };
