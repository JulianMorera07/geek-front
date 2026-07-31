'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import type { AdjacentEpisode } from '@/features/playback/api/types';

const AUTO_ADVANCE_SECONDS = 10;

export interface NextEpisodePromptProps {
  next: AdjacentEpisode;
  onCancel: () => void;
}

/**
 * Overlay que aparece al terminar un episodio (ver `EpisodePlayer` — solo se
 * dispara cuando se conoce la duración real, nunca con el estimado
 * genérico): cuenta regresiva para pasar solo si el usuario no interactúa,
 * o el usuario puede ir ya mismo o cancelar y seguir viendo el actual.
 */
function NextEpisodePrompt({ next, onCancel }: Readonly<NextEpisodePromptProps>) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = React.useState(AUTO_ADVANCE_SECONDS);
  const nextHref = next.href;

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      router.push(nextHref);
      return;
    }
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, nextHref, router]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/80 p-6 text-center backdrop-blur-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancelar"
        className="absolute top-2 right-2 text-white hover:bg-white/10 hover:text-white"
        onClick={onCancel}
      >
        <XIcon />
      </Button>
      <Text className="text-white">Episodio terminado</Text>
      <Text variant="muted">Siguiente episodio en {secondsLeft}s…</Text>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => router.push(nextHref)}>
          Ver ahora
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export { NextEpisodePrompt };
