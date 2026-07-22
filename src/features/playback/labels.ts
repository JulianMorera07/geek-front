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
