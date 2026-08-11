'use client';

import { HeartIcon } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';

import { Grid } from '@/components/base/grid';
import { EmptyState } from '@/components/base/empty-state';
import { ErrorView } from '@/components/base/error-view';
import { AnimeCard } from '@/features/anime/components/anime-card';
import { AnimeCardSkeleton } from '@/features/anime/components/skeletons';
import { animeKeys } from '@/features/anime/api/queries';
import { fetchAnimeById } from '@/features/anime/api/http-client';
import { useAuth } from '@/features/auth/use-auth';
import { useFavoritesQuery } from '@/features/favorites/api/queries';

/**
 * `GET /favorites` solo trae `anime_id` + `created_at` — el detalle de cada
 * anime (título, portada, etc.) se pide aparte en paralelo (`useQueries`),
 * mismo patrón que `RelatedAnimeRow` para `anime.relations`.
 */
function FavoritesPageClient() {
  const { isAuthenticated } = useAuth();
  const favoritesQuery = useFavoritesQuery(isAuthenticated);

  const animeIds = favoritesQuery.data?.map((f) => f.animeId) ?? [];
  const detailQueries = useQueries({
    queries: animeIds.map((id) => ({
      queryKey: animeKeys.detail(id),
      queryFn: () => fetchAnimeById(id),
      staleTime: 60_000,
    })),
  });

  if (favoritesQuery.isPending) {
    return (
      <Grid columns="cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </Grid>
    );
  }

  if (favoritesQuery.isError) {
    return (
      <ErrorView
        title="No pudimos cargar tus favoritos"
        description="Ocurrió un problema al consultar la lista."
        onRetry={() => favoritesQuery.refetch()}
      />
    );
  }

  const isLoadingDetails = detailQueries.some((q) => q.isPending);
  const animes = detailQueries.map((q) => q.data).filter((a) => a !== undefined);

  if (isLoadingDetails && animes.length === 0) {
    return (
      <Grid columns="cards">
        {animeIds.map((id) => (
          <AnimeCardSkeleton key={id} />
        ))}
      </Grid>
    );
  }

  if (animes.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon className="size-6" />}
        title="Todavía no tienes favoritos"
        description="Los animes que marques con el corazón van a aparecer acá."
      />
    );
  }

  return (
    <Grid columns="cards">
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </Grid>
  );
}

export { FavoritesPageClient };
