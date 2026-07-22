import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    size: {
      default: 'max-w-7xl',
      narrow: 'max-w-3xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface ContainerProps
  extends React.ComponentProps<'div'>, VariantProps<typeof containerVariants> {}

/** Wrapper de ancho máximo + padding responsive. Centraliza la escala de espaciado horizontal de la app. */
function Container({ className, size, ...props }: ContainerProps) {
  return <div className={cn(containerVariants({ size }), className)} {...props} />;
}

export { Container, containerVariants };
