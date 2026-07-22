'use client';

import * as React from 'react';

import { Spinner } from '@/components/base/loading';

export interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  /** Distancia antes de llegar al final en la que se dispara la carga (IntersectionObserver `rootMargin`). */
  rootMargin?: string;
}

/**
 * Sentinela genérico de scroll infinito: cuando entra al viewport (con
 * margen anticipado) y `hasMore` es true, dispara `onLoadMore`. No sabe nada
 * de anime/paginación — solo observa su propia visibilidad.
 */
function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading = false,
  rootMargin = '400px',
}: InfiniteScrollTriggerProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, rootMargin]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className="flex items-center justify-center py-8" aria-hidden={!isLoading}>
      {isLoading ? <Spinner /> : null}
    </div>
  );
}

export { InfiniteScrollTrigger };
