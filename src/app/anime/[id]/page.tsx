import { notFound } from 'next/navigation';
import { StarIcon } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { AnimeCover } from '@/features/anime/components/anime-cover';
import { Badge } from '@/components/ui/badge';
import { EpisodeList } from '@/features/anime/components/episode-list';
import { RelatedAnimeRow } from '@/features/anime/components/related-anime-row';
import { fetchAnimeById, fetchGenres } from '@/features/anime/api/http-client';
import { statusLabel, statusVariant } from '@/features/anime/status';
import { isNotFoundError } from '@/lib/api-error';

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let anime;
  try {
    anime = await fetchAnimeById(id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  const genres = await fetchGenres().catch(() => []);
  const animeGenres = genres.filter((genre) => anime.genreIds.includes(genre.id));

  return (
    <Container className="flex flex-col gap-10 py-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <AnimeCover
          animeId={anime.id}
          thumbnailUrl={anime.thumbnailUrl}
          alt={anime.title}
          label={anime.thumbnailUrl ? undefined : anime.title}
          className="w-full max-w-64 sm:w-56"
        />
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(anime.status)}>{statusLabel(anime.status)}</Badge>
            <Badge variant="outline" className="capitalize">
              {anime.type}
            </Badge>
            {animeGenres.map((genre) => (
              <Badge key={genre.id} variant="outline">
                {genre.name}
              </Badge>
            ))}
          </div>

          <Heading level="h1">{anime.title}</Heading>

          {anime.rating ? (
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <span className="text-foreground flex items-center gap-1 font-medium">
                <StarIcon className="fill-warning text-warning size-4" />
                {anime.rating.score.toFixed(1)}
              </span>
              <span className="capitalize">{anime.rating.source}</span>
            </div>
          ) : null}

          {anime.synopsis ? (
            <Text variant="lead" className="max-w-2xl">
              {anime.synopsis}
            </Text>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <Heading level="h3">Episodios</Heading>
        <EpisodeList animeId={anime.id} animeThumbnailUrl={anime.thumbnailUrl} pageSize={12} />
      </section>

      {anime.relations.length > 0 ? (
        <RelatedAnimeRow title="Relacionados" relations={anime.relations} />
      ) : null}
    </Container>
  );
}
