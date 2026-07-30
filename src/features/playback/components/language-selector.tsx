'use client';

import { LanguagesIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { audioLanguageLabel } from '@/features/playback/labels';

export interface LanguageSelectorProps {
  languages: string[];
  value: string | null;
  onChange: (languageCode: string) => void;
}

/**
 * Selector de idioma de audio (ej. "Japonés (Sub)" vs. "Español Latino"),
 * separado de `SourceSelector` (servidor) — filtra qué fuentes están
 * disponibles para elegir servidor, en vez de mezclarse en una sola lista.
 * Oculto si solo hay un idioma disponible (nada que elegir).
 */
function LanguageSelector({ languages, value, onChange }: LanguageSelectorProps) {
  if (languages.length <= 1) return null;

  return (
    <Select value={value ?? undefined} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger className="w-full sm:w-48" aria-label="Idioma">
        <LanguagesIcon className="text-muted-foreground" />
        <SelectValue placeholder="Idioma">
          {(selected: string | null) => (selected ? audioLanguageLabel(selected) : 'Idioma')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((code) => (
          <SelectItem key={code} value={code}>
            {audioLanguageLabel(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { LanguageSelector };
