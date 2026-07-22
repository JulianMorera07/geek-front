import Link from 'next/link';
import { CompassIcon } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { EmptyState } from '@/components/base/empty-state';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<CompassIcon className="size-6" />}
        title="Página no encontrada"
        description="El contenido que buscas no existe o fue movido."
        action={
          <Button render={<Link href="/" />} className="mt-2">
            Volver al inicio
          </Button>
        }
      />
    </Container>
  );
}
