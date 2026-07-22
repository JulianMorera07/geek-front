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
import { externalBridgeHref } from '@/features/anime/external-bridge-href';
import type { DiscoveryResult } from '@/features/anime/api/types';

export interface DiscoveryBannerProps {
  results: DiscoveryResult[];
  /** ms entre slides. 0 desactiva el autoplay. */
  interval?: number;
  className?: string;
}

/**
 * Hero de "nuevos animes" para la Home — misma mecánica de carrusel que
 * `Banner` (autoplay con crossfade, pausado con `prefers-reduced-motion`),
 * pero alimentado por `/latest` (Provider Framework) en vez del catálogo
 * interno: no tienen `id` propio, así que el CTA va al puente
 * `/anime/external/:providerId/:externalId` (ingesta al catálogo interno
 * al click), no directo a `/anime/[id]`. Sin fuentes, el resultado no tiene
 * a dónde ir — se filtra antes de llegar acá.
 */
function DiscoveryBanner({ results, interval = 6000, className }: DiscoveryBannerProps) {
  const [index, setIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const featured = results.filter((r) => r.sources.length > 0).slice(0, 4);

  React.useEffect(() => {
    if (interval <= 0 || prefersReducedMotion || featured.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % featured.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, prefersReducedMotion, featured.length]);

  if (featured.length === 0) return null;
  const result = featured[index];
  const primarySource = result.sources[0];

  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[21/9]',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${result.title}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 flex items-end p-6 sm:p-10"
          style={result.thumbnailUrl ? undefined : { backgroundImage: seedToGradient(result.title) }}
        >
          {result.thumbnailUrl ? (
            <Image
              src={result.thumbnailUrl}
              alt={result.title}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative flex max-w-xl flex-col gap-3">
            <Badge variant="outline" className="w-fit border-white/30 text-white">
              Nuevo
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-white sm:text-4xl">
              {result.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <StarIcon className="fill-warning text-warning size-3.5" />
                {(result.qualityScore * 10).toFixed(1)}
              </span>
              {result.animeType ? (
                <>
                  <span>·</span>
                  <span className="capitalize">{result.animeType}</span>
                </>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {primarySource ? (
                <Button
                  render={<Link href={externalBridgeHref(primarySource, result.thumbnailUrl)} />}
                >
                  <InfoIcon />
                  Ver detalles
                </Button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {featured.length > 1 ? (
        <div className="absolute right-6 bottom-4 flex gap-1.5 sm:right-10">
          {featured.map((item, i) => (
            <button
              key={`${item.title}-${i}`}
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

export { DiscoveryBanner };
