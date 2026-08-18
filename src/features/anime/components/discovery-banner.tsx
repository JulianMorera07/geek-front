'use client';

import { type TouchEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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

export function DiscoveryBanner({ results, className }: Readonly<DiscoveryBannerProps>) {
  const [current, setCurrent] = useState(0);
  // mounted evita que el banner intente renderizar contenido dinámico
  // durante la hidratación — el servidor siempre renderiza null y el
  // cliente toma el control tras montar. Esto elimina el error #418.
  const [mounted, setMounted] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || results.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % results.length);
    }, 5000);
    // `current` en las deps: cualquier navegación manual (flechas o puntos)
    // reinicia el temporizador, para que no salte solo a los dos segundos de
    // haber elegido algo a mano.
    return () => clearInterval(interval);
  }, [mounted, results.length, current]);

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
        'group/banner relative w-full touch-pan-y overflow-hidden rounded-xl bg-muted',
        'aspect-[3/4] sm:aspect-video lg:aspect-[16/6]',
        className,
      )}
    >
      {item.thumbnailUrl && (
        <>
          {/* Fondo: la misma imagen ampliada y desenfocada, rellena todo el
              marco sin importar su proporción real. Sin esto, `object-cover`
              directo sobre pósters verticales en un marco panorámico (desktop)
              recorta casi toda la imagen — se ve "horrible", confirmado en
              vivo. */}
          <Image
            src={item.thumbnailUrl}
            alt=""
            aria-hidden
            fill
            className="scale-110 object-cover opacity-40 blur-2xl"
            unoptimized
          />
          {/* Primer plano: la imagen completa, sin recortar (`object-contain`) — se ve entera sin importar si es un póster vertical o un banner ancho. */}
          <Image
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            className="object-contain"
            unoptimized
          />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 flex max-w-lg flex-col gap-2 p-4 sm:p-6">
        {item.animeType && (
          <Badge variant="secondary" className="w-fit capitalize">
            {item.animeType}
          </Badge>
        )}
        <h2 className="line-clamp-2 text-xl font-bold text-white sm:text-2xl">{item.title}</h2>
        {href && (
          <Link href={href}>
            <Button size="sm" variant="secondary">
              {isDirectEpisode ? 'Ver episodio' : 'Ver detalles'}
            </Button>
          </Link>
        )}
      </div>
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
            className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 -translate-x-2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 ease-out group-hover/banner:translate-x-0 group-hover/banner:opacity-100 hover:bg-black/50 hover:scale-105 focus-visible:translate-x-0 focus-visible:opacity-100 sm:flex"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(current + 1)}
            className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 ease-out group-hover/banner:translate-x-0 group-hover/banner:opacity-100 hover:bg-black/50 hover:scale-105 focus-visible:translate-x-0 focus-visible:opacity-100 sm:flex"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <div className="absolute right-4 bottom-4 flex gap-1">
            {results.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === current ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
