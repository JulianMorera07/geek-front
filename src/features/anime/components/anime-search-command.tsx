'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { SearchCommand, useCommandShortcut } from '@/components/base/search-command';
import { MediaCover } from '@/components/base/media-cover';
import { AnimeCover } from '@/features/anime/components/anime-cover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { externalBridgeHref } from '@/features/anime/external-bridge-href';
import { fetchCatalog, fetchSearch } from '@/features/anime/api/http-client';
import { useGenresQuery } from '@/features/anime/api/queries';

export interface AnimeSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Paleta de búsqueda global (⌘K). Antes cargaba un top-8 fijo del catálogo al
 * abrir y dejaba que `cmdk` lo filtrara localmente — así, tipear cualquier
 * cosa que no estuviera en esos 8 primeros items no encontraba nada, aunque
 * sí existiera en el backend. Ahora el input está controlado (`value`, con
 * debounce) y dispara una búsqueda real: catálogo interno primero
 * (`fetchCatalog({ q })`, linkea directo a `/anime/[id]`) y, si no hay nada
 * ahí, el Provider Framework (`fetchSearch`, linkea al puente de ingesta) —
 * mismo patrón que `/search`. `shouldFilter={false}` porque el filtrado ya lo
 * hace el backend, no `cmdk`.
 */
function AnimeSearchCommand({ open, onOpenChange }: AnimeSearchCommandProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query);
  const trimmedQuery = debouncedQuery.trim();

  const catalogQuery = useQuery({
    queryKey: ['anime', 'command-palette', trimmedQuery],
    queryFn: () => fetchCatalog({ q: trimmedQuery || undefined, pageSize: 8 }),
    enabled: open,
  });
  const catalogItems = catalogQuery.data?.items ?? [];
  const catalogEmpty = !catalogQuery.isPending && catalogItems.length === 0;

  const externalQuery = useQuery({
    queryKey: ['anime', 'command-palette-external', trimmedQuery],
    queryFn: () => fetchSearch({ q: trimmedQuery, pageSize: 5 }),
    enabled: open && catalogEmpty && trimmedQuery.length > 0,
  });

  const genresQuery = useGenresQuery();

  return (
    <SearchCommand
      open={open}
      onOpenChange={onOpenChange}
      value={query}
      onValueChange={setQuery}
      shouldFilter={false}
      placeholder="Buscar animes, géneros…"
      groups={[
        {
          heading: 'Animes',
          items: [
            ...catalogItems.map((anime) => ({
              value: `catalog-${anime.id}`,
              label: anime.title,
              icon: (
                <AnimeCover
                  animeId={anime.id}
                  thumbnailUrl={anime.thumbnailUrl}
                  className="size-6 rounded-sm"
                />
              ),
              onSelect: () => router.push(`/anime/${anime.id}`),
            })),
            ...(catalogEmpty ? (externalQuery.data ?? []) : []).map((result, index) => {
              const primarySource = result.sources[0];
              return {
                value: `external-${index}-${result.title}`,
                label: result.title,
                icon: (
                  <MediaCover
                    seed={result.title}
                    src={result.thumbnailUrl ?? undefined}
                    className="size-6 rounded-sm"
                  />
                ),
                onSelect: () => {
                  if (!primarySource) return;
                  router.push(externalBridgeHref(primarySource, result.thumbnailUrl));
                },
              };
            }),
          ],
        },
        {
          heading: 'Géneros',
          items: (genresQuery.data ?? []).map((genre) => ({
            value: `genre-${genre.id}`,
            label: genre.name,
            onSelect: () => router.push(`/genre/${genre.id}`),
          })),
        },
      ]}
    />
  );
}

export { AnimeSearchCommand, useCommandShortcut };
