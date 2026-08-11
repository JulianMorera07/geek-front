'use client';

import * as React from 'react';
import { HeartIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import {
  useAddFavoriteMutation,
  useFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/features/favorites/api/queries';

export interface FavoriteButtonProps {
  animeId: string;
  className?: string;
  /** `icon`: círculo compacto para overlay de card. `full`: botón con texto, para la ficha del anime. */
  variant?: 'icon' | 'full';
}

/**
 * Oculto por completo si no hay sesión — mismo criterio que el resto de
 * features gateadas por login en esta app (mejor no mostrar algo que no va a
 * funcionar que mostrarlo deshabilitado o con un prompt de login intrusivo).
 * `useFavoritesQuery` comparte cache entre todas las instancias (misma
 * queryKey sin importar el `animeId`), así que renderizar muchos botones en
 * un grid no dispara N requests, solo uno compartido.
 */
function FavoriteButton({ animeId, className, variant = 'icon' }: Readonly<FavoriteButtonProps>) {
  const { isAuthenticated } = useAuth();
  const favoritesQuery = useFavoritesQuery(isAuthenticated);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();

  if (!isAuthenticated) return null;

  const isFavorite = favoritesQuery.data?.some((f) => f.animeId === animeId) ?? false;
  const isPending = addFavorite.isPending || removeFavorite.isPending;

  function handleClick(event: React.MouseEvent) {
    // Los botones ícono viven dentro de un `<Link>` de card — sin esto,
    // hacer click también navegaría a la ficha del anime.
    event.preventDefault();
    event.stopPropagation();
    if (isFavorite) removeFavorite.mutate(animeId);
    else addFavorite.mutate(animeId);
  }

  if (variant === 'full') {
    return (
      <Button
        type="button"
        variant={isFavorite ? 'secondary' : 'outline'}
        onClick={handleClick}
        disabled={isPending}
        className={className}
      >
        <HeartIcon className={cn('size-4', isFavorite && 'fill-current')} />
        {isFavorite ? 'En favoritos' : 'Agregar a favoritos'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={isFavorite}
      className={cn(
        'bg-background/80 text-foreground flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors hover:bg-background disabled:opacity-50',
        className,
      )}
    >
      <HeartIcon className={cn('size-4', isFavorite && 'fill-destructive text-destructive')} />
    </button>
  );
}

export { FavoriteButton };
