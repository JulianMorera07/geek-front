'use client';

import * as React from 'react';
import { ClapperboardIcon } from 'lucide-react';

import { Grid } from '@/components/base/grid';
import { Pagination } from '@/components/base/pagination';
import { EmptyState } from '@/components/base/empty-state';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { EpisodeCard } from '@/features/anime/components/episode-card';
import { paginateArray } from '@/lib/paginate';
import type { Episode, Season } from '@/features/anime/api/types';

export interface SeasonEpisodeListProps {
  animeId: string;
  seasons: Season[];
  animeThumbnailUrl?: string | null;
  pageSize?: number;
}

function seasonLabel(season: Season): string {
  return season.title ? `Temporada ${season.number}: ${season.title}` : `Temporada ${season.number}`;
}

/** Grid paginado de episodios de UNA temporada — cada panel del acordeón mantiene su propia página. */
function SeasonEpisodesGrid({
  animeId,
  episodes,
  animeThumbnailUrl,
  pageSize,
}: {
  animeId: string;
  episodes: Episode[];
  animeThumbnailUrl?: string | null;
  pageSize: number;
}) {
  const [page, setPage] = React.useState(1);
  const { items, pageCount } = paginateArray(episodes, page, pageSize);

  return (
    <div className="flex flex-col gap-6">
      <Grid columns="wide">
        {items.map((episode) => (
          <EpisodeCard
            key={episode.id}
            animeId={animeId}
            episode={episode}
            animeThumbnailUrl={animeThumbnailUrl}
          />
        ))}
      </Grid>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}

/**
 * Episodios agrupados por temporada real cuando el anime tiene más de una
 * (hoy: solo VerAnime las trae así, cada una con `number`/`title` propios —
 * jkanime/tioanime/animeflv siguen devolviendo una única temporada con todos
 * los episodios adentro). Con una sola temporada se muestra el grid plano de
 * siempre, sin acordeón — no tiene sentido agrupar cuando no hay nada que
 * separar.
 */
function SeasonEpisodeList({
  animeId,
  seasons,
  animeThumbnailUrl,
  pageSize = 12,
}: Readonly<SeasonEpisodeListProps>) {
  const sortedSeasons = [...seasons].sort((a, b) => b.number - a.number);
  const totalEpisodes = sortedSeasons.reduce((sum, s) => sum + s.episodes.length, 0);

  if (totalEpisodes === 0) {
    return (
      <EmptyState
        icon={<ClapperboardIcon className="size-6" />}
        title="Todavía no hay episodios"
        description="Vuelve pronto — este contenido se actualiza seguido."
      />
    );
  }

  if (sortedSeasons.length <= 1) {
    return (
      <SeasonEpisodesGrid
        animeId={animeId}
        episodes={sortedSeasons[0]?.episodes ?? []}
        animeThumbnailUrl={animeThumbnailUrl}
        pageSize={pageSize}
      />
    );
  }

  return (
    <Accordion defaultValue={[sortedSeasons[0].id]}>
      {sortedSeasons.map((season) => (
        <AccordionItem key={season.id} value={season.id}>
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span>{seasonLabel(season)}</span>
              <Badge variant="outline">
                {season.episodes.length} {season.episodes.length === 1 ? 'capítulo' : 'capítulos'}
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionPanel>
            <SeasonEpisodesGrid
              animeId={animeId}
              episodes={season.episodes}
              animeThumbnailUrl={animeThumbnailUrl}
              pageSize={pageSize}
            />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { SeasonEpisodeList };
