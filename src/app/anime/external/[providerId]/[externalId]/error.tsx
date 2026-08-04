'use client';

import * as React from 'react';

import { Container } from '@/components/layout/container';
import { ErrorView } from '@/components/base/error-view';

/**
 * Boundary propio para el bridge externo (en vez de caer al genérico
 * `app/error.tsx`) — acá el fallo casi siempre es la ingesta tardando más de
 * `EXTERNAL_INGEST_TIMEOUT_MS` (30s) contra un proveedor lento, o un error
 * real del proveedor al traer el detalle. `reset()` reintenta la carga del
 * segmento (vuelve a correr el Server Component), sin recargar toda la app.
 */
export default function ExternalAnimeBridgeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16">
      <ErrorView
        title="No pudimos importar este anime"
        description="El proveedor externo tardó demasiado o no respondió. Puede ser algo puntual — intenta de nuevo en unos segundos."
        onRetry={reset}
      />
    </Container>
  );
}
