import { Grid } from '@/components/base/grid';
import { GenreCard } from '@/features/anime/components/genre-card';
import type { Genre } from '@/features/anime/api/types';

export interface GenreGridProps {
  genres: Genre[];
}

/**
 * Grid de géneros. La API real (`GET /genres`) no expone un conteo de animes
 * por género (a diferencia del mock) — mostrarlo requeriría una consulta al
 * catálogo por cada género (N+1), así que se omite en vez de fabricarlo.
 */
function GenreGrid({ genres }: GenreGridProps) {
  return (
    <Grid columns="compact">
      {genres.map((genre) => (
        <GenreCard key={genre.id} genre={genre} />
      ))}
    </Grid>
  );
}

export { GenreGrid };
