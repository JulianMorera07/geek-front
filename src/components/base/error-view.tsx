import * as React from 'react';
import { TriangleAlertIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/base/typography';

export interface ErrorViewProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  /** Acción principal (típicamente "Reintentar"). Omitir si no aplica. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Vista de error genérica y reutilizable — para `error.tsx` de rutas,
 * secciones que fallan al cargar datos, o resultados fallidos de una mutación.
 */
function ErrorView({
  title = 'Algo salió mal',
  description = 'No pudimos cargar este contenido. Intenta de nuevo en unos segundos.',
  icon,
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: ErrorViewProps) {
  return (
    <div
      role="alert"
      className={cn(
        'border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        {icon ?? <TriangleAlertIcon className="size-6" />}
      </div>
      <Heading level="h4">{title}</Heading>
      <Text variant="muted" className="max-w-sm">
        {description}
      </Text>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorView };
