'use client';

import * as React from 'react';
import { ClapperboardIcon } from 'lucide-react';

import { EmptyState } from '@/components/base/empty-state';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { EpisodeRangeAccordion } from '@/features/anime/components/episode-range-accordion';
import { useContinueWatchingEntry } from '@/features/playback/hooks/use-continue-watching-entry';
import type { Season } from '@/features/anime/api/types';

export interface SeasonEpisodeListProps {
  animeId: string;
  seasons: Season[];
  animeThumbnailUrl?: string | null;
  pageSize?: number;
}

function seasonLabel(season: Season): string {
  return season.title ? `Temporada ${season.number}: ${season.title}` : `Temporada ${season.number}`;
}

/**
 * Episodios agrupados por temporada real cuando el anime tiene más de una
 * (hoy: solo VerAnime las trae así, cada una con `number`/`title` propios —
 * jkanime/tioanime/animeflv siguen devolviendo una única temporada con todos
 * los episodios adentro). Con una sola temporada se muestra el acordeón de
 * tramos directo, sin envolver en otro acordeón de temporadas.
 *
 * Dentro de cada temporada, los episodios van en tramos por acordeón (ver
 * `EpisodeRangeAccordion`) en vez de paginación numerada.
 *
 * Si hay progreso guardado (`useContinueWatchingEntry`) para alguna de las
 * temporadas, esa es la que se abre por defecto en vez de la más reciente —
 * así "quedaste aquí" es visible sin tener que buscar la temporada a mano.
 */
function SeasonEpisodeList({
  animeId,
  seasons,
  animeThumbnailUrl,
  pageSize = 50,
}: Readonly<SeasonEpisodeListProps>) {
  const sortedSeasons = [...seasons].sort((a, b) => b.number - a.number);
  const totalEpisodes = sortedSeasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const continueWatching = useContinueWatchingEntry(animeId);
  const currentSeason = sortedSeasons.find((s) => s.number === continueWatching?.seasonNumber);

  // Controlado, no `defaultValue`: el progreso llega después del primer
  // render (efecto async), así que hay que poder abrir la temporada correcta
  // una vez que se resuelva. `openValue` empieza en la más reciente y salta a
  // la del progreso guardado apenas se conoce, una sola vez.
  const [openValue, setOpenValue] = React.useState<string[]>(() =>
    sortedSeasons[0] ? [sortedSeasons[0].id] : [],
  );
  const jumpedRef = React.useRef(false);
  React.useEffect(() => {
    if (jumpedRef.current || !currentSeason) return;
    jumpedRef.current = true;
    setOpenValue([currentSeason.id]);
  }, [currentSeason]);

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
      <EpisodeRangeAccordion
        animeId={animeId}
        episodes={sortedSeasons[0]?.episodes ?? []}
        animeThumbnailUrl={animeThumbnailUrl}
        chunkSize={pageSize}
        currentEpisodeNumber={continueWatching?.episodeNumber}
      />
    );
  }

  return (
    <Accordion value={openValue} onValueChange={(value) => setOpenValue(value as string[])}>
      {sortedSeasons.map((season) => (
        <AccordionItem key={season.id} value={season.id}>
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span>{seasonLabel(season)}</span>
              <Badge variant="outline">
                {season.episodes.length} {season.episodes.length === 1 ? 'capítulo' : 'capítulos'}
              </Badge>
              {season.id === currentSeason?.id ? <Badge variant="default">Quedaste aquí</Badge> : null}
            </span>
          </AccordionTrigger>
          <AccordionPanel>
            <EpisodeRangeAccordion
              animeId={animeId}
              episodes={season.episodes}
              animeThumbnailUrl={animeThumbnailUrl}
              chunkSize={pageSize}
              currentEpisodeNumber={season.id === currentSeason?.id ? continueWatching?.episodeNumber : undefined}
            />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { SeasonEpisodeList };
