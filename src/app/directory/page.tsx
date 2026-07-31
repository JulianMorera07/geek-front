import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { DirectoryPageClient } from '@/features/anime/components/directory-page-client';

export default function DirectoryPage() {
  return (
    <Container className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Explorar</Heading>
        <Text variant="muted">
          Directorio filtrable, agregado en vivo desde los proveedores externos
        </Text>
      </div>
      <DirectoryPageClient />
    </Container>
  );
}
