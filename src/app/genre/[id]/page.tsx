import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { GenrePageClient } from '@/features/anime/components/genre-page-client';
import { fetchGenreById } from '@/features/anime/api/http-client';
import { isNotFoundError } from '@/lib/api-error';

export default async function GenreViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let genre;
  try {
    genre = await fetchGenreById(id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  return (
    <Container className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">{genre.name}</Heading>
        <Text variant="muted">Animes del catálogo en este género</Text>
      </div>
      <GenrePageClient genreId={genre.id} />
    </Container>
  );
}
