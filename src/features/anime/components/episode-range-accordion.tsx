'use client';

import * as React from 'react';

import { Grid } from '@/components/base/grid';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { EpisodeCard } from '@/features/anime/components/episode-card';
import type { Episode } from '@/features/anime/api/types';

export interface EpisodeRangeAccordionProps {
  animeId: string;
  episodes: Episode[];
  animeThumbnailUrl?: string | null;
  /** Cuántos episodios entran en cada tramo del acordeón (p. ej. "Del 1 al 50"). */
  chunkSize?: number;
  /** Episodio donde el usuario se quedó, si esta lista es la que tiene el progreso guardado — marca "Quedaste aquí" y todo lo anterior como visto. */
  currentEpisodeNumber?: number;
}

interface RangeGroup {
  key: string;
  label: string;
  episodes: Episode[];
  containsCurrent: boolean;
}

/** Divide en tramos de `chunkSize` (orden ascendente por número), y devuelve los tramos del más reciente al más antiguo, con los episodios de cada tramo también del más reciente al más antiguo. */
function buildRangeGroups(episodes: Episode[], chunkSize: number, currentEpisodeNumber?: number): RangeGroup[] {
  const sorted = [...episodes].sort((a, b) => a.number - b.number);
  const groups: RangeGroup[] = [];

  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const first = chunk[0].number;
    const last = chunk[chunk.length - 1].number;
    groups.push({
      key: `${first}-${last}`,
      label: first === last ? `Episodio ${first}` : `Del ${first} al ${last}`,
      episodes: [...chunk].reverse(),
      containsCurrent:
        currentEpisodeNumber !== undefined && currentEpisodeNumber >= first && currentEpisodeNumber <= last,
    });
  }

  return groups.reverse();
}

/**
 * Episodios agrupados en tramos ("Del 51 al 95", "Del 1 al 50"...) en vez de
 * paginación numerada — cada tramo es un panel de acordeón, del más reciente
 * al más antiguo, y dentro de cada tramo los episodios también van del más
 * reciente al más antiguo. El tramo que contiene el episodio donde el
 * usuario se quedó se abre solo (una vez, al resolverse el progreso); los
 * episodios con número menor al actual quedan marcados como "Visto".
 */
function EpisodeRangeAccordion({
  animeId,
  episodes,
  animeThumbnailUrl,
  chunkSize = 50,
  currentEpisodeNumber,
}: Readonly<EpisodeRangeAccordionProps>) {
  const groups = React.useMemo(
    () => buildRangeGroups(episodes, chunkSize, currentEpisodeNumber),
    [episodes, chunkSize, currentEpisodeNumber],
  );

  const [openValue, setOpenValue] = React.useState<string[]>(() => {
    const target = groups.find((g) => g.containsCurrent) ?? groups[0];
    return target ? [target.key] : [];
  });
  const jumpedRef = React.useRef(false);
  React.useEffect(() => {
    if (jumpedRef.current || currentEpisodeNumber === undefined) return;
    const target = groups.find((g) => g.containsCurrent)?.key;
    if (!target) return;
    jumpedRef.current = true;
    setOpenValue([target]);
  }, [groups, currentEpisodeNumber]);

  function renderEpisodeGrid(groupEpisodes: Episode[]) {
    return (
      <Grid columns="wide">
        {groupEpisodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            animeId={animeId}
            episode={episode}
            animeThumbnailUrl={animeThumbnailUrl}
            isCurrent={episode.number === currentEpisodeNumber}
            isWatched={currentEpisodeNumber !== undefined && episode.number < currentEpisodeNumber}
          />
        ))}
      </Grid>
    );
  }

  // Un solo tramo (anime corto, cabe entero en un `chunkSize`): no vale la
  // pena envolver en acordeón, se muestra directo.
  if (groups.length <= 1) {
    return renderEpisodeGrid(groups[0]?.episodes ?? []);
  }

  return (
    <Accordion value={openValue} onValueChange={(value) => setOpenValue(value as string[])}>
      {groups.map((group) => (
        <AccordionItem key={group.key} value={group.key}>
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <span>{group.label}</span>
              <Badge variant="outline">
                {group.episodes.length} {group.episodes.length === 1 ? 'capítulo' : 'capítulos'}
              </Badge>
              {group.containsCurrent ? <Badge variant="default">Quedaste aquí</Badge> : null}
            </span>
          </AccordionTrigger>
          <AccordionPanel>{renderEpisodeGrid(group.episodes)}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { EpisodeRangeAccordion };
