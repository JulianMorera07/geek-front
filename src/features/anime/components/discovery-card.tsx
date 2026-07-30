import Link from 'next/link';
import { StarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MediaCover } from '@/components/base/media-cover';
import { Badge } from '@/components/ui/badge';
import { discoveryResultHref } from '@/features/anime/external-bridge-href';
import type { DiscoveryResult } from '@/features/anime/api/types';

export interface DiscoveryCardProps {
  result: DiscoveryResult;
  className?: string;
}

/**
 * Card de un resultado del Provider Framework (`/popular`, `/latest`,
 * `/new-animes`, `/search`) — a diferencia de `AnimeCard`, esto NO es una
 * entrada del catálogo interno: no tiene `id` propio. Usa la fuente de mayor
 * prioridad (`sources[0]`); sin fuentes, no hay a dónde ir.
 *
 * El destino del click depende de si la fuente trae `episodeNumber`:
 * - `/latest` (episodios recién publicados) SÍ lo trae → va directo al
 *   reproductor (`/watch/external/...`), sin pasar por la ficha del anime.
 * - `/popular`/`/new-animes`/`/search` (listados de series) lo traen `null`
 *   → va al puente `/anime/external/:providerId/:externalId`, que ingiere el
 *   anime (si hace falta) y redirige a la ficha real.
 */
function DiscoveryCard({ result, className }: Readonly<DiscoveryCardProps>) {
  const href = discoveryResultHref(result);

  const content = (
    <>
      <MediaCover
        seed={result.title}
        src={result.thumbnailUrl ?? undefined}
        alt={result.title}
        label={result.thumbnailUrl ? undefined : result.title}
        overlay={
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <StarIcon className="fill-warning text-warning size-3" />
            {(result.qualityScore * 10).toFixed(1)}
          </div>
        }
      />
      <div className="flex flex-col gap-0.5">
        <h3 className="text-foreground line-clamp-1 text-sm font-medium">{result.title}</h3>
        <p className="text-muted-foreground text-xs">
          {[result.year, result.animeType].filter(Boolean).join(' · ') || 'Externo'}
        </p>
      </div>
      {result.sources.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {/* Cantidad de servidores, no el proveedor real (tioanime/jkanime) — no exponemos marcas de terceros en la UI. */}
          <Badge variant="outline" className="text-[10px]">
            {result.sources.length} servidores
          </Badge>
        </div>
      ) : null}
    </>
  );

  const sharedClassName = cn('flex w-full flex-col gap-2 rounded-lg', className);

  if (!href) {
    return <div className={sharedClassName}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        sharedClassName,
        'group focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
      )}
    >
      {content}
    </Link>
  );
}

export { DiscoveryCard };
