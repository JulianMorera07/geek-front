import * as React from 'react';
import { InboxIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Heading, Text } from '@/components/base/typography';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  /** Acción opcional (ej. "Limpiar filtros", "Volver al inicio"). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vacío genérico y reutilizable — listas sin resultados, búsquedas
 * sin coincidencias, secciones sin contenido todavía. Nunca dejar una
 * sección en blanco sin explicar por qué (regla del sistema de diseño).
 */
function EmptyState({
  title = 'Nada por aquí todavía',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center',
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        {icon ?? <InboxIcon className="size-6" />}
      </div>
      <Heading level="h4">{title}</Heading>
      {description ? (
        <Text variant="muted" className="max-w-sm">
          {description}
        </Text>
      ) : null}
      {action}
    </div>
  );
}

export { EmptyState };
