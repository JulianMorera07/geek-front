import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { PopularPageClient } from '@/features/anime/components/popular-page-client';

export default function PopularPage() {
  return (
    <Container className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Populares</Heading>
        <Text variant="muted">Agregado en vivo desde los proveedores externos</Text>
      </div>
      <PopularPageClient />
    </Container>
  );
}
