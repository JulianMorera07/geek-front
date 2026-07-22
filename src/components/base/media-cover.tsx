import * as React from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { seedToGradient } from '@/lib/placeholder';

// `text-white` es intencional (no `text-foreground`/`text-background`): el
// gradiente placeholder siempre es oscuro, en ambos temas — el contenido
// superpuesto (label, overlay, badges) necesita texto claro fijo, no ligado
// al token de tema. Cuando hay imagen real (`src`), el mismo contraste
// aplica igual (fotos de anime son casi siempre oscuras/saturadas).
const mediaCoverVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden text-white',
  {
    variants: {
      ratio: {
        poster: 'aspect-2/3',
        video: 'aspect-video',
        square: 'aspect-square',
      },
      rounded: {
        default: 'rounded-lg',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      ratio: 'poster',
      rounded: 'default',
    },
  },
);

export interface MediaCoverProps
  extends Omit<React.ComponentProps<'div'>, 'children'>, VariantProps<typeof mediaCoverVariants> {
  /** Semilla determinística (ej. id del anime) para el gradiente placeholder. */
  seed: string;
  /** Se muestra como marca de agua tipográfica cuando no hay `src`. Opcional. */
  label?: string;
  /** Overlay opcional (badges, botón de play, gradiente de legibilidad). */
  overlay?: React.ReactNode;
  /** URL de imagen real (el backend la provee vía provider externo). Si no viene, se usa el placeholder. */
  src?: string;
  alt?: string;
}

/**
 * Cover de anime/episodio. Con `src` renderiza la imagen real (`next/image`,
 * `fill` + `object-cover`); sin `src` cae al placeholder con gradiente
 * determinístico (mismo `seed` → mismo color, sin parpadeos en listas).
 */
function MediaCover({
  seed,
  label,
  overlay,
  ratio,
  rounded,
  className,
  style,
  src,
  alt,
  ...props
}: MediaCoverProps) {
  return (
    <div
      className={cn(mediaCoverVariants({ ratio, rounded }), className)}
      style={src ? style : { backgroundImage: seedToGradient(seed), ...style }}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? ''}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      ) : label ? (
        <span
          aria-hidden
          className="font-heading px-3 text-center text-sm font-semibold text-balance opacity-80 select-none"
        >
          {label}
        </span>
      ) : null}
      {overlay}
    </div>
  );
}

export { MediaCover, mediaCoverVariants };
