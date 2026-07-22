'use client';

import { Carousel } from '@/components/base/carousel';
import { Heading } from '@/components/base/typography';
import { useRelatedAnimesQuery } from '@/features/anime/api/queries';
import { AnimeCard } from '@/features/anime/components/anime-card';
import { AnimeCardSkeleton } from '@/features/anime/components/skeletons';
import type { Relation } from '@/features/anime/api/types';

export interface RelatedAnimeRowProps {
  title: string;
  relations: Relation[];
}

/**
 * `AnimeDetail.relations` solo trae `related_anime_id` + `relation_type` — se
 * pide el detalle de cada uno en paralelo (`useQueries`, acotado al tamaño de
 * `relations`, típicamente pocos ítems). Los que fallan (404, error de red)
 * simplemente no se muestran, sin romper el resto de la fila.
 */
function RelatedAnimeRow({ title, relations }: RelatedAnimeRowProps) {
  const results = useRelatedAnimesQuery(relations.map((r) => r.relatedAnimeId));
  const isLoading = results.some((r) => r.isPending);
  const animes = results.map((r) => r.data).filter((a) => a !== undefined);

  if (!isLoading && animes.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <Heading level="h3">{title}</Heading>
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {relations.map((r) => (
            <div key={r.relatedAnimeId} className="w-36 shrink-0 sm:w-44">
              <AnimeCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <Carousel>
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} className="w-36 shrink-0 snap-start sm:w-44" />
          ))}
        </Carousel>
      )}
    </section>
  );
}

export { RelatedAnimeRow };
