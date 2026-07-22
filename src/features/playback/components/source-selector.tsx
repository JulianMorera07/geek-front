'use client';

import { ServerIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { qualityLabel } from '@/features/playback/labels';
import type { PlaybackSource } from '@/features/playback/api/types';

export interface SourceSelectorProps {
  sources: PlaybackSource[];
  value: string | null;
  onChange: (sourceId: string) => void;
}

function sourceLabel(source: PlaybackSource): string {
  const audio = source.audio.languageCode ? ` · ${source.audio.languageCode.toUpperCase()}` : '';
  return `${source.serverName} · ${qualityLabel(source.quality)}${audio}`;
}

/**
 * Selector de servidor/fuente — cada fuente ya trae su propia calidad y pista
 * de audio fijas. `Select.Value` de Base UI no infiere la etiqueta desde los
 * `Select.Item` (a diferencia de Radix) — sin `children` como función acá
 * muestra el `value` crudo (el UUID de la fuente), no el texto legible.
 */
function SourceSelector({ sources, value, onChange }: SourceSelectorProps) {
  if (sources.length === 0) return null;

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger className="w-full sm:w-48" aria-label="Servidor">
        <ServerIcon className="text-muted-foreground" />
        <SelectValue placeholder="Servidor">
          {(selected: string | null) => {
            const source = sources.find((s) => s.id === selected);
            return source ? sourceLabel(source) : 'Servidor';
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sources.map((source) => (
          <SelectItem key={source.id} value={source.id} disabled={!source.isActive}>
            {sourceLabel(source)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SourceSelector };
