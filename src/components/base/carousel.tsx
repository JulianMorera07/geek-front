'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CarouselProps extends React.ComponentProps<'div'> {
  /** Cada hijo debe controlar su propio ancho (ej. `w-40 shrink-0`). */
  children: React.ReactNode;
  /** Cantidad de píxeles a desplazar por click de flecha. */
  scrollAmount?: number;
}

/**
 * Carrusel horizontal con scroll-snap nativo (sin librería externa).
 * Las flechas se ocultan automáticamente si no hay overflow o se llegó al borde.
 * Reutilizable para cualquier fila de cards (anime, episodios, géneros).
 */
function Carousel({ children, className, scrollAmount = 480, ...props }: CarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 8);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    track.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      track.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState]);

  function scrollBy(direction: 'prev' | 'next') {
    trackRef.current?.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }

  return (
    <div className={cn('group/carousel relative', className)} {...props}>
      <div
        ref={trackRef}
        className="no-scrollbar scroll-fade-x flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {children}
      </div>

      {canScrollPrev ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Anterior"
          onClick={() => scrollBy('prev')}
          className="absolute top-1/2 left-1 z-10 -translate-y-1/2 opacity-0 shadow-md transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100"
        >
          <ChevronLeftIcon />
        </Button>
      ) : null}

      {canScrollNext ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Siguiente"
          onClick={() => scrollBy('next')}
          className="absolute top-1/2 right-1 z-10 -translate-y-1/2 opacity-0 shadow-md transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100"
        >
          <ChevronRightIcon />
        </Button>
      ) : null}
    </div>
  );
}

export { Carousel };
