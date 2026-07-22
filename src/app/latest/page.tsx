import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { LatestPageClient } from '@/features/anime/components/latest-page-client';

export default function LatestPage() {
  return (
    <Container className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Últimos</Heading>
        <Text variant="muted">Agregado en vivo desde los proveedores externos</Text>
      </div>
      <LatestPageClient />
    </Container>
  );
}
