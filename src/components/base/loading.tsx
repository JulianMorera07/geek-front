import * as React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: {
      sm: 'size-4',
      default: 'size-5',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface SpinnerProps
  extends React.ComponentProps<'svg'>, VariantProps<typeof spinnerVariants> {}

/** Indicador de carga atómico. Úsalo dentro de botones, cards o inline junto a texto. */
function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Cargando"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
}

/**
 * Bloque de carga para una sección/card (no bloquea la página completa).
 * Reemplaza el contenido mientras `label` describe qué se está cargando.
 */
function SectionLoader({ label = 'Cargando…', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-2 py-10 text-center', className)}
    >
      <Spinner size="lg" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

/**
 * Overlay de carga a pantalla completa (fixed). Reservado para transiciones
 * de página o acciones bloqueantes explícitas — no para loading de listas/cards
 * (usar Skeleton o SectionLoader en ese caso).
 */
function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
    >
      <Spinner size="lg" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export { Spinner, SectionLoader, PageLoader, spinnerVariants };
