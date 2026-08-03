'use client';

import * as React from 'react';
import { SkipForwardIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SkipInterval } from '@/features/playback/api/types';

const SKIP_LABEL: Record<SkipInterval['kind'], string> = {
  op: 'Saltar intro',
  ed: 'Saltar outro',
};

export interface NativeVideoPlayerProps {
  src: string;
  title: string;
  poster?: string | null;
  skipIntervals: SkipInterval[];
  /** Segundo desde donde arrancar (resume point) — se aplica una sola vez, al montar el video. */
  startAtSeconds?: number;
  onProgress: (currentTimeSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
  /** El backend advierte que `directUrl` es best-effort (algunos proveedores cambian su ofuscación sin aviso) — si el archivo no carga, se avisa para caer al `<iframe>` de siempre en vez de dejar la pantalla en negro. */
  onError: () => void;
}

/**
 * Cuando el backend resuelve `source.directUrl` (archivo real, no la página
 * de embed), se puede usar un `<video>` propio con control total: seek real,
 * saltar op/ed de verdad (no solo nuestro contador aproximado), y saber el
 * fin exacto por el evento nativo `ended` — a diferencia de `VideoPlayer`
 * (iframe de terceros), acá si hay señal real de progreso.
 */
function NativeVideoPlayer({
  src,
  title,
  poster,
  skipIntervals,
  startAtSeconds = 0,
  onProgress,
  onEnded,
  onError,
}: Readonly<NativeVideoPlayerProps>) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const seekedRef = React.useRef(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  React.useEffect(() => {
    seekedRef.current = false;
    setCurrentTime(0);
  }, [src]);

  const activeInterval =
    skipIntervals.find((s) => currentTime >= s.startSeconds && currentTime < s.endSeconds) ?? null;

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video || seekedRef.current) return;
    seekedRef.current = true;
    if (startAtSeconds > 0) video.currentTime = startAtSeconds;
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onProgress(video.currentTime, video.duration || 0);
  }

  function handleSkip() {
    const video = videoRef.current;
    if (!video || !activeInterval) return;
    video.currentTime = activeInterval.endSeconds;
  }

  return (
    <div className="relative">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- los subtítulos, cuando existen, se manejan aparte vía `SubtitleSelector`/pistas del proveedor, no hay archivo .vtt propio que adjuntar acá. */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        poster={poster ?? undefined}
        title={title}
        controls
        autoPlay
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onError={onError}
        className="aspect-video w-full rounded-xl bg-black"
      />
      {activeInterval ? (
        <Button
          type="button"
          size="sm"
          onClick={handleSkip}
          className={cn(
            'absolute right-4 bottom-16 gap-1.5 shadow-lg backdrop-blur-md',
            'bg-white/90 text-black hover:bg-white',
          )}
        >
          {SKIP_LABEL[activeInterval.kind]}
          <SkipForwardIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export { NativeVideoPlayer };
