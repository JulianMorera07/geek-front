import type { StreamQuality } from '@/features/playback/api/types';

const QUALITY_LABELS: Record<StreamQuality, string> = {
  sd: 'SD',
  hd: 'HD',
  fhd: 'Full HD',
  uhd: '4K',
};

export function qualityLabel(quality: StreamQuality): string {
  return QUALITY_LABELS[quality] ?? quality.toUpperCase();
}

/**
 * Códigos de idioma de audio reales vistos en `PlaybackSource.audio.languageCode`
 * — variantes conocidas del backend/proveedores, no un estándar BCP-47 estricto.
 * Cualquier código no listado cae al fallback (el código tal cual, en mayúsculas).
 */
const AUDIO_LANGUAGE_LABELS: Record<string, string> = {
  ja: 'Japonés (Sub)',
  jp: 'Japonés (Sub)',
  japones: 'Japonés (Sub)',
  es: 'Español Latino',
  'es-419': 'Español Latino',
  'es-la': 'Español Latino',
  'español latino': 'Español Latino',
  latino: 'Español Latino',
  en: 'Inglés',
};

export function audioLanguageLabel(code: string): string {
  return AUDIO_LANGUAGE_LABELS[code.toLowerCase()] ?? code.toUpperCase();
}
