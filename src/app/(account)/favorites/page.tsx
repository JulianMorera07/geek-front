import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { FavoritesPageClient } from '@/features/favorites/components/favorites-page-client';

export default function FavoritesPage() {
  return (
    <Container className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Favoritos</Heading>
        <Text variant="muted">Los animes que has marcado con el corazón.</Text>
      </div>
      <FavoritesPageClient />
    </Container>
  );
}
