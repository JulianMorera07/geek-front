'use client';

import { FilterBar } from '@/components/base/filter-bar';
import type { DirectoryQueryParams } from '@/features/anime/api/types';

export type DirectoryFiltersState = Pick<DirectoryQueryParams, 'type' | 'status' | 'audio' | 'order'>;

export const defaultDirectoryFilters: DirectoryFiltersState = {};

const TYPE_OPTIONS = [
  { value: 'TV', label: 'TV' },
  { value: 'Movie', label: 'Película' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'Special', label: 'Especial' },
];

// Vocabulario propio de `/directory` ("airing"/"finished"/"upcoming") — distinto
// al del catálogo interno ("ongoing"/"completed"/...) que usa `statusLabel`.
const STATUS_OPTIONS = [
  { value: 'airing', label: 'En emisión' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'upcoming', label: 'Próximamente' },
];

const AUDIO_OPTIONS = [{ value: 'dub', label: 'Doblado' }];

const ORDER_OPTIONS = [
  { value: 'popularity', label: 'Popularidad' },
  { value: 'date', label: 'Fecha' },
  { value: 'name', label: 'Nombre' },
];

export interface DirectoryFiltersProps {
  value: DirectoryFiltersState;
  onChange: (value: DirectoryFiltersState) => void;
}

/**
 * Filtros de `/directory`: tipo, estado, audio (solo "doblado" tiene efecto
 * real hoy — ningún proveedor filtra "solo subtitulado" como opción propia,
 * documentado por el backend) y orden (solo jkanime lo soporta; tioanime lo
 * ignora en silencio, no da error — resultados combinados pueden no verse
 * perfectamente ordenados). Sin filtro de género: el vocabulario no está
 * unificado entre proveedores (mismo problema por el que se quitó del
 * sidebar) — agregarlo requeriría decidir contra qué proveedor filtrar.
 */
function DirectoryFilters({ value, onChange }: DirectoryFiltersProps) {
  const groups = [
    {
      id: 'type',
      label: 'Tipo',
      mode: 'single' as const,
      options: TYPE_OPTIONS,
      value: value.type ? [value.type] : [],
      onChange: (next: string[]) =>
        onChange({ ...value, type: next[0] as DirectoryFiltersState['type'] }),
    },
    {
      id: 'status',
      label: 'Estado',
      mode: 'single' as const,
      options: STATUS_OPTIONS,
      value: value.status ? [value.status] : [],
      onChange: (next: string[]) =>
        onChange({ ...value, status: next[0] as DirectoryFiltersState['status'] }),
    },
    {
      id: 'audio',
      label: 'Audio',
      mode: 'single' as const,
      options: AUDIO_OPTIONS,
      value: value.audio ? [value.audio] : [],
      onChange: (next: string[]) =>
        onChange({ ...value, audio: next[0] as DirectoryFiltersState['audio'] }),
    },
  ];

  return (
    <FilterBar
      groups={groups}
      sort={{
        label: 'Ordenar',
        value: value.order ?? 'popularity',
        options: ORDER_OPTIONS,
        onChange: (next) => onChange({ ...value, order: next as DirectoryFiltersState['order'] }),
      }}
      onClear={() => onChange(defaultDirectoryFilters)}
    />
  );
}

export { DirectoryFilters };
