'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { InfoIcon, StarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { seedToGradient } from '@/lib/placeholder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statusLabel, statusVariant } from '@/features/anime/status';
import type { AnimeSummary } from '@/features/anime/api/types';

export interface BannerProps {
  animes: AnimeSummary[];
  /** ms entre slides. 0 desactiva el autoplay. */
  interval?: number;
  className?: string;
}

/**
 * Hero destacado de la home. Autoplay con crossfade (Framer Motion),
 * pausado si el usuario prefiere menos movimiento (`prefers-reduced-motion`).
 * El catálogo interno (`AnimeSummary`) no trae sinopsis/año/cantidad de
 * episodios — solo se muestra lo que la API realmente da.
 */
function Banner({ animes, interval = 6000, className }: BannerProps) {
  const [index, setIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const featured = animes.slice(0, 5);

  React.useEffect(() => {
    if (interval <= 0 || prefersReducedMotion || featured.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % featured.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, prefersReducedMotion, featured.length]);

  if (featured.length === 0) return null;
  const anime = featured[index];

  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[21/9]',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 flex items-end p-6 sm:p-10"
          style={anime.thumbnailUrl ? undefined : { backgroundImage: seedToGradient(anime.id) }}
        >
          {anime.thumbnailUrl ? (
            <Image
              src={anime.thumbnailUrl}
              alt={anime.title}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative flex max-w-xl flex-col gap-3">
            <Badge variant={statusVariant(anime.status)} className="w-fit">
              {statusLabel(anime.status)}
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-white sm:text-4xl">
              {anime.title}
            </h2>
            {anime.rating ? (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <StarIcon className="fill-warning text-warning size-3.5" />
                  {anime.rating.score.toFixed(1)}
                </span>
                <span>·</span>
                <span className="capitalize">{anime.type}</span>
              </div>
            ) : (
              <span className="text-sm text-white/80 capitalize">{anime.type}</span>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Button render={<Link href={`/anime/${anime.id}`} />}>
                <InfoIcon />
                Ver detalles
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {featured.length > 1 ? (
        <div className="absolute right-6 bottom-4 flex gap-1.5 sm:right-10">
          {featured.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir a destacado ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { Banner };
