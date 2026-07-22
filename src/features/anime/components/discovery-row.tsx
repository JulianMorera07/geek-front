import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';

import { Carousel } from '@/components/base/carousel';
import { Heading } from '@/components/base/typography';
import { DiscoveryCard } from '@/features/anime/components/discovery-card';
import type { DiscoveryResult } from '@/features/anime/api/types';

export interface DiscoveryRowProps {
  title: string;
  results: DiscoveryResult[];
  viewAllHref?: string;
}

/** Fila horizontal de resultados del Provider Framework — misma estructura visual que `AnimeRow`. */
function DiscoveryRow({ title, results, viewAllHref }: DiscoveryRowProps) {
  if (results.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Heading level="h3">{title}</Heading>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"
          >
            Ver todo
            <ChevronRightIcon className="size-4" />
          </Link>
        ) : null}
      </div>
      <Carousel>
        {results.map((result, index) => (
          <DiscoveryCard
            key={`${result.title}-${index}`}
            result={result}
            className="w-36 shrink-0 snap-start sm:w-44"
          />
        ))}
      </Carousel>
    </section>
  );
}

export { DiscoveryRow };
