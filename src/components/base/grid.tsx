import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const gridVariants = cva('grid gap-4 sm:gap-5', {
  variants: {
    columns: {
      /** Cards de poster (anime) — denso. */
      cards: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      /** Cards horizontales (episodios). */
      wide: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      /** Cards de género — compactas. */
      compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    },
  },
  defaultVariants: {
    columns: 'cards',
  },
});

export interface GridProps extends React.ComponentProps<'div'>, VariantProps<typeof gridVariants> {}

/** Grid responsive mobile-first. La escala de columnas es la única fuente de verdad para densidad de listados. */
function Grid({ className, columns, ...props }: GridProps) {
  return <div className={cn(gridVariants({ columns }), className)} {...props} />;
}

export { Grid, gridVariants };
