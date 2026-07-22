import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/base/typography';

export default function ExternalAnimeBridgeLoading() {
  return (
    <Container className="flex flex-col items-center gap-4 py-16 text-center">
      <Skeleton className="aspect-2/3 w-full max-w-64 rounded-lg" />
      <Text variant="muted">Importando desde el proveedor externo…</Text>
    </Container>
  );
}
