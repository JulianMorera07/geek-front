'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/base/badge';
import { Button } from '@/components/base/button';
import type { DiscoveryResult } from '@/features/anime/api/types';

interface DiscoveryBannerProps {
  results: DiscoveryResult[];
}

export function DiscoveryBanner({ results }: DiscoveryBannerProps) {
  const [current, setCurrent] = useState(0);
  // mounted evita que el banner intente renderizar contenido dinámico
  // durante la hidratación — el servidor siempre renderiza null y el
  // cliente toma el control tras montar. Esto elimina el error #418.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || results.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % results.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted, results.length]);

  if (!mounted || results.length === 0) return null;

  const item = results[current];
  if (!item) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-[21/9] bg-muted">
      {item.thumbnailUrl && (
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          className="object-cover opacity-60"
          unoptimized
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2 max-w-lg">
        {item.animeType && (
          <Badge variant="secondary" className="w-fit capitalize">
            {item.animeType}
          </Badge>
        )}
        <h2 className="text-white text-2xl font-bold line-clamp-2">{item.title}</h2>
        {item.sources[0] && (
          <Link
            href={`/anime/external/${item.sources[0].providerId}/${item.sources[0].externalId}`}
          >
            <Button size="sm" variant="secondary">
              Ver detalles
            </Button>
          </Link>
        )}
      </div>
      {results.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1">
          {results.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}