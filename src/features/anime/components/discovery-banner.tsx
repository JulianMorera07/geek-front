'use client';

import { type TouchEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { discoveryResultHref } from '@/features/anime/external-bridge-href';
import type { DiscoveryResult } from '@/features/anime/api/types';

interface DiscoveryBannerProps {
  results: DiscoveryResult[];
  className?: string;
}

/** Un swipe más corto que esto se ignora — evita que un tap accidental con un poco de arrastre cambie de slide. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * Spotlight de la home: panel con degradado (marca) + póster en su propia
 * card, en vez del hero panorámico anterior que estiraba el póster (vertical
 * por naturaleza — son carátulas, no fotos panorámicas) sobre un marco ancho.
 * Ese enfoque siempre se veía "recortado" o "en caja" pase lo que pase con
 * blur/mask, porque la proporción de origen nunca calza con un banner 16:6 —
 * reportado en vivo dos veces. Acá el póster se muestra en SU proporción
 * natural (2:3), sin forzar nada, con su propio resplandor detrás.
 */
export function DiscoveryBanner({ results, className }: Readonly<DiscoveryBannerProps>) {
  const [current, setCurrent] = useState(0);
  // mounted evita que el banner intente renderizar contenido dinámico
  // durante la hidratación — el servidor siempre renderiza null y el
  // cliente toma el control tras montar. Esto elimina el error #418.
  const [mounted, setMounted] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || prefersReducedMotion || results.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % results.length);
    }, 6000);
    // `current` en las deps: cualquier navegación manual (flechas, puntos o
    // swipe) reinicia el temporizador, para que no salte solo a los pocos
    // segundos de haber elegido algo a mano.
    return () => clearInterval(interval);
  }, [mounted, prefersReducedMotion, results.length, current]);

  if (!mounted || results.length === 0) return null;

  const item = results[current];
  if (!item) return null;

  const href = discoveryResultHref(item);
  // Si la fuente trae `episodeNumber` (resultados de `/latest`), el link va
  // directo a reproducir — el label debe reflejarlo, no decir "Ver detalles"
  // para algo que abre el reproductor de una.
  const isDirectEpisode = item.sources[0]?.episodeNumber != null;

  function goTo(index: number) {
    setCurrent(((index % results.length) + results.length) % results.length);
  }

  // Deslizar con el dedo en mobile (no hay flechas ahí, ver botones más
  // abajo) — solo horizontal, sin librería: basta comparar el X inicial y
  // final del toque.
  function handleTouchStart(event: TouchEvent) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }
  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    setTouchStartX(null);
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? current + 1 : current - 1);
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'group/banner from-primary/15 border-border/60 relative w-full touch-pan-y overflow-hidden rounded-2xl border bg-gradient-to-br via-background to-background',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col-reverse items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-10 lg:gap-12"
        >
          <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            {item.animeType && (
              <Badge variant="secondary" className="w-fit capitalize">
                {item.animeType}
              </Badge>
            )}
            <h2 className="font-heading text-2xl leading-tight font-bold text-balance sm:text-3xl lg:text-4xl">
              {item.title}
            </h2>
            {href && (
              <Link href={href} className="mt-1">
                <Button size="lg">
                  {isDirectEpisode ? <PlayIcon /> : null}
                  {isDirectEpisode ? 'Ver episodio' : 'Ver detalles'}
                </Button>
              </Link>
            )}
          </div>

          {item.thumbnailUrl && (
            <div className="relative w-40 shrink-0 sm:w-52 lg:w-60">
              {/* Resplandor ambiental: copia borrosa de la MISMA card, detrás
                  y del mismo tamaño — al estar contenida a la propia card
                  (no estirada a todo el banner) no genera ningún borde/costura
                  visible, solo un halo de color a su alrededor. */}
              <div className="absolute inset-0 scale-105 opacity-70 blur-2xl" aria-hidden>
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  className="rounded-xl object-cover"
                  unoptimized
                />
              </div>
              <div className="ring-border/40 relative aspect-2/3 overflow-hidden rounded-xl shadow-2xl ring-1">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {results.length > 1 && (
        <>
          {/* Flechas: solo desktop (`hidden sm:flex`) — en mobile se navega
              deslizando (ver `handleTouchStart`/`handleTouchEnd`), unas
              flechas fijas ahí solo estorban. En desktop aparecen con un
              fade + slide sutil al pasar el mouse sobre el banner, no de
              golpe. */}
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(current - 1)}
            className="absolute top-1/2 left-3 hidden size-11 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 ease-out group-hover/banner:translate-x-0 group-hover/banner:opacity-100 hover:scale-105 hover:bg-black/50 focus-visible:translate-x-0 focus-visible:opacity-100 sm:flex"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(current + 1)}
            className="absolute top-1/2 right-3 hidden size-11 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 ease-out group-hover/banner:translate-x-0 group-hover/banner:opacity-100 hover:scale-105 hover:bg-black/50 focus-visible:translate-x-0 focus-visible:opacity-100 sm:flex"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:right-6 sm:left-auto sm:translate-x-0">
            {results.map((result, i) => (
              <button
                key={result.sources[0] ? `${result.sources[0].providerId}:${result.sources[0].externalId}` : result.title}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === current}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === current ? 'bg-primary w-6' : 'bg-foreground/20 w-1.5',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
