'use client';

import { FilterBar } from '@/components/base/filter-bar';
import { useCatalogFacetsQuery } from '@/features/anime/api/queries';
import { statusLabel } from '@/features/anime/status';
import type { CatalogQueryParams } from '@/features/anime/api/types';

export type CatalogFiltersState = Pick<CatalogQueryParams, 'genreId' | 'status' | 'type'>;

export interface AnimeFiltersProps {
  value: CatalogFiltersState;
  onChange: (value: CatalogFiltersState) => void;
  /** Oculta el filtro de género (ej. en Genre View, donde ya viene fijo por la ruta). */
  hideGenre?: boolean;
}

export const defaultCatalogFilters: CatalogFiltersState = {};

/**
 * Configura `FilterBar` para el catálogo interno: género + estado + tipo,
 * todos de selección única — el backend real (`GET /anime`) solo acepta un
 * valor por filtro (no arrays), a diferencia del mock del sprint anterior.
 * Las opciones salen de `GET /catalog` (facetas), sin hardcodear valores.
 */
function AnimeFilters({ value, onChange, hideGenre = false }: AnimeFiltersProps) {
  const facetsQuery = useCatalogFacetsQuery();
  const facets = facetsQuery.data;

  const groups = [
    ...(hideGenre || !facets?.genres.length
      ? []
      : [
          {
            id: 'genre',
            label: 'Género',
            mode: 'single' as const,
            options: facets.genres.map((g) => ({ value: g.id, label: g.name })),
            value: value.genreId ? [value.genreId] : [],
            onChange: (next: string[]) => onChange({ ...value, genreId: next[0] }),
          },
        ]),
    ...(facets?.statuses.length
      ? [
          {
            id: 'status',
            label: 'Estado',
            mode: 'single' as const,
            options: facets.statuses.map((s) => ({ value: s, label: statusLabel(s) })),
            value: value.status ? [value.status] : [],
            onChange: (next: string[]) => onChange({ ...value, status: next[0] }),
          },
        ]
      : []),
    ...(facets?.types.length
      ? [
          {
            id: 'type',
            label: 'Tipo',
            mode: 'single' as const,
            options: facets.types.map((t) => ({ value: t, label: t.toUpperCase() })),
            value: value.type ? [value.type] : [],
            onChange: (next: string[]) => onChange({ ...value, type: next[0] }),
          },
        ]
      : []),
  ];

  return (
    <FilterBar
      groups={groups}
      onClear={() => onChange(hideGenre ? { genreId: value.genreId } : {})}
    />
  );
}

export { AnimeFilters };
