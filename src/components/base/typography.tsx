import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Escala de encabezados del sistema de diseño.
 * Usa la fuente display (Sora, `font-heading`) — reservada a títulos, nunca a texto de párrafo.
 */
const headingVariants = cva('font-heading text-balance text-foreground', {
  variants: {
    level: {
      h1: 'text-3xl leading-tight font-semibold tracking-tight sm:text-4xl',
      h2: 'text-2xl leading-tight font-semibold tracking-tight sm:text-3xl',
      h3: 'text-xl leading-snug font-semibold tracking-tight sm:text-2xl',
      h4: 'text-lg leading-snug font-medium tracking-tight',
    },
  },
  defaultVariants: {
    level: 'h1',
  },
});

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

export interface HeadingProps
  extends Omit<React.ComponentProps<'h1'>, 'color'>, VariantProps<typeof headingVariants> {
  /** Elemento HTML a renderizar. Por defecto sigue a `level`. */
  as?: HeadingLevel;
}

/** Título del sistema de diseño. `level` controla tanto el tag semántico como el tamaño, salvo que se pase `as`. */
function Heading({ level = 'h1', as, className, ...props }: HeadingProps) {
  const Tag = as ?? level ?? 'h1';
  return (
    <Tag data-slot="heading" className={cn(headingVariants({ level }), className)} {...props} />
  );
}

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      body: 'text-sm leading-relaxed sm:text-base',
      lead: 'text-base leading-relaxed text-muted-foreground sm:text-lg',
      muted: 'text-sm text-muted-foreground',
      small: 'text-xs text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

export interface TextProps extends React.ComponentProps<'p'>, VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div';
}

/** Texto de cuerpo. Usa siempre la fuente sans (nunca `font-heading`). */
function Text({ variant = 'body', as = 'p', className, ...props }: TextProps) {
  const Tag = as;
  return <Tag data-slot="text" className={cn(textVariants({ variant }), className)} {...props} />;
}

export { Heading, Text, headingVariants, textVariants };
