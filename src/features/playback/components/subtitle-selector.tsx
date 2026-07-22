'use client';

import { SubtitlesIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Subtitle } from '@/features/playback/api/types';

const NONE_VALUE = '__none__';

export interface SubtitleSelectorProps {
  subtitles: Subtitle[];
  value: string | null;
  onChange: (languageCode: string | null) => void;
}

/**
 * Selector de subtítulos de la fuente actualmente seleccionada, con opción
 * "Ninguno". Ver nota en `SourceSelector`: `Select.Value` de Base UI necesita
 * `children` como función para mostrar una etiqueta legible en vez del
 * `value` crudo.
 */
function SubtitleSelector({ subtitles, value, onChange }: SubtitleSelectorProps) {
  if (subtitles.length === 0) return null;

  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
    >
      <SelectTrigger className="w-full sm:w-40" aria-label="Subtítulos">
        <SubtitlesIcon className="text-muted-foreground" />
        <SelectValue placeholder="Subtítulos">
          {(selected: string) => (selected === NONE_VALUE ? 'Ninguno' : selected.toUpperCase())}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Ninguno</SelectItem>
        {subtitles.map((subtitle) => (
          <SelectItem key={subtitle.languageCode} value={subtitle.languageCode}>
            {subtitle.languageCode.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SubtitleSelector };
