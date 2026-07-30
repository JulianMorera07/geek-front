'use client';

import * as React from 'react';
import { PlayCircleIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorView } from '@/components/base/error-view';
import { EmptyState } from '@/components/base/empty-state';
import { Heading, Text } from '@/components/base/typography';
import {
  useCreatePlaybackSessionMutation,
  useEpisodePlaybackQuery,
  useNextEpisodeQuery,
  usePlaybackResumePointQuery,
  usePreviousEpisodeQuery,
  useSavePlaybackProgressMutation,
  useSelectPlaybackQualityMutation,
  useSelectPlaybackSourceMutation,
  useSelectPlaybackSubtitleMutation,
} from '@/features/playback/api/queries';
import { VideoPlayer } from '@/features/playback/components/video-player';
import { SourceSelector } from '@/features/playback/components/source-selector';
import { SubtitleSelector } from '@/features/playback/components/subtitle-selector';
import { EpisodeNavigation } from '@/features/playback/components/episode-navigation';
import { getStoredSessionId, storeSessionId } from '@/features/playback/session-storage';
import { isNotFoundError } from '@/lib/api-error';
import type { PlaybackSource } from '@/features/playback/api/types';

const PROGRESS_SAVE_INTERVAL_MS = 10_000;
/** Estimado cuando el backend no informa duración real (típico en fuentes externas): ~24 min. */
const DEFAULT_EPISODE_DURATION_SECONDS = 24 * 60;

export interface WatchPageClientProps {
  animeId: string;
  episodeId: string;
}

function WatchPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
    </div>
  );
}

function formatMinutes(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Orquesta la reproducción de un episodio: pide metadata+fuentes, reutiliza
 * (o crea) una sesión de reproducción anónima persistida en `localStorage`
 * por episodio — así el resume point sobrevive a un refresh o a volver más
 * tarde, logueado o no. Las fuentes reales son embeds de terceros (ver
 * `VideoPlayer`), así que el progreso no puede leerse del reproductor: se
 * aproxima con tiempo transcurrido en pantalla, guardado cada ~10s.
 */
function WatchPageClient({ animeId, episodeId }: WatchPageClientProps) {
  const playbackQuery = useEpisodePlaybackQuery(animeId, episodeId);

  const createSession = useCreatePlaybackSessionMutation();
  const selectSource = useSelectPlaybackSourceMutation();
  const selectQuality = useSelectPlaybackQualityMutation();
  const selectSubtitle = useSelectPlaybackSubtitleMutation();
  const saveProgress = useSavePlaybackProgressMutation();

  const [manualSourceId, setManualSourceId] = React.useState<string | null>(null);
  const [manualSubtitle, setManualSubtitle] = React.useState<{
    sourceId: string;
    languageCode: string | null;
  } | null>(null);
  const [trackedEpisodeId, setTrackedEpisodeId] = React.useState(episodeId);
  // Arranca siempre en `null` (igual en servidor y en el primer render de
  // hidratación en cliente) y se sincroniza con `localStorage` en un efecto
  // aparte, después del montaje. Leer `localStorage` directo en el
  // inicializador de `useState` produce un valor distinto en SSR (`null`,
  // `window` no existe) vs. la hidratación en cliente (el valor real
  // guardado), lo que React detecta como mismatch y tumba toda la página con
  // el error #418 sin dejar rastro en consola aparte de ese código minificado.
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const sessionRequestedForRef = React.useRef<string | null>(null);
  const elapsedSecondsRef = React.useRef(0);
  const lastSaveRef = React.useRef(0);

  React.useEffect(() => {
    setSessionId(getStoredSessionId(episodeId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; el cambio de episodio ya se maneja en el ajuste de estado de abajo.
  }, []);

  // Reinicia selección manual + sesión al cambiar de episodio (ajuste de
  // estado durante el render, no en un efecto — ver nota de más abajo).
  if (trackedEpisodeId !== episodeId) {
    setTrackedEpisodeId(episodeId);
    setManualSourceId(null);
    setManualSubtitle(null);
    setSessionId(getStoredSessionId(episodeId));
  }

  const sources = playbackQuery.data?.sources ?? [];
  const defaultSource = sources.find((s) => s.isActive) ?? sources[0];
  const currentSource: PlaybackSource | undefined =
    sources.find((s) => s.id === manualSourceId) ?? defaultSource;
  const defaultSubtitleLanguage =
    currentSource?.subtitles.find((s) => s.isDefault)?.languageCode ?? null;
  const subtitleLanguage =
    manualSubtitle && manualSubtitle.sourceId === currentSource?.id
      ? manualSubtitle.languageCode
      : defaultSubtitleLanguage;

  // Crea una sesión nueva solo si no había una guardada para este episodio.
  React.useEffect(() => {
    if (!playbackQuery.data || sources.length === 0) return;
    if (sessionId) return;
    if (sessionRequestedForRef.current === episodeId) return;
    sessionRequestedForRef.current = episodeId;
    createSession.mutate(episodeId, {
      onSuccess: (created) => {
        storeSessionId(episodeId, created.id);
        setSessionId(created.id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara una sola vez por episodeId sin sesión guardada, no en cada cambio de `createSession`.
  }, [playbackQuery.data, episodeId, sources.length, sessionId]);

  // Sincroniza la fuente/calidad con la sesión (recién creada o reutilizada).
  React.useEffect(() => {
    if (!sessionId || !currentSource) return;
    selectSource.mutate({ sessionId, sourceId: currentSource.id });
    selectQuality.mutate({ sessionId, quality: currentSource.quality });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia la sesión o la fuente resuelta, no las mutations.
  }, [sessionId, currentSource?.id]);

  const resumePointQuery = usePlaybackResumePointQuery(sessionId ?? undefined);

  // El progreso real del embed no es legible (iframe cross-origin) — se
  // aproxima con tiempo transcurrido en pantalla, arrancando desde el resume
  // point conocido, y se guarda cada ~10s.
  React.useEffect(() => {
    if (!sessionId || !currentSource) return;
    elapsedSecondsRef.current =
      resumePointQuery.data && !resumePointQuery.data.isCompleted
        ? resumePointQuery.data.positionSeconds
        : 0;
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 1;
      const now = Date.now();
      if (now - lastSaveRef.current < PROGRESS_SAVE_INTERVAL_MS) return;
      lastSaveRef.current = now;
      // Sin duración real (habitual: el backend no la conoce para fuentes
      // externas), se usa un estimado generoso de episodio de anime — nunca
      // `elapsed + 1`, que dejaría el porcentaje siempre en ~100% y el
      // backend marcaría la sesión como completada casi al instante.
      const durationSeconds =
        playbackQuery.data?.metadata.durationSeconds ??
        Math.max(DEFAULT_EPISODE_DURATION_SECONDS, elapsedSecondsRef.current + 60);
      saveProgress.mutate({
        sessionId,
        positionSeconds: elapsedSecondsRef.current,
        durationSeconds,
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arranca el timer al cambiar de sesión/fuente o al llegar el resume point; no en cada cambio de `saveProgress`.
  }, [sessionId, currentSource?.id, resumePointQuery.data]);

  function handleSourceChange(nextSourceId: string) {
    setManualSourceId(nextSourceId);
    setManualSubtitle(null);
    const source = sources.find((s) => s.id === nextSourceId);
    if (sessionId) {
      selectSource.mutate({ sessionId, sourceId: nextSourceId });
      if (source) selectQuality.mutate({ sessionId, quality: source.quality });
    }
  }

  function handleSubtitleChange(languageCode: string | null) {
    if (!currentSource) return;
    setManualSubtitle({ sourceId: currentSource.id, languageCode });
    if (sessionId) {
      const subtitle = currentSource.subtitles.find((s) => s.languageCode === languageCode);
      selectSubtitle.mutate({
        sessionId,
        languageCode,
        languageName: subtitle?.languageCode ?? null,
      });
    }
  }

  const metadata = playbackQuery.data?.metadata;
  const nextQuery = useNextEpisodeQuery(animeId, metadata?.seasonNumber, metadata?.episodeNumber);
  const previousQuery = usePreviousEpisodeQuery(
    animeId,
    metadata?.seasonNumber,
    metadata?.episodeNumber,
  );

  if (playbackQuery.isPending) {
    return <WatchPageSkeleton />;
  }

  if (playbackQuery.isError) {
    if (isNotFoundError(playbackQuery.error)) {
      return (
        <ErrorView
          title="Episodio no encontrado"
          description="El anime o el episodio que buscas no existe."
        />
      );
    }
    return (
      <ErrorView
        title="No pudimos cargar el reproductor"
        description="Ocurrió un problema al consultar las fuentes de este episodio."
        onRetry={() => playbackQuery.refetch()}
      />
    );
  }

  if (sources.length === 0) {
    return (
      <EmptyState
        icon={<PlayCircleIcon className="size-6" />}
        title="Sin fuentes de reproducción"
        description="Todavía no hay ningún servidor disponible para este episodio."
      />
    );
  }

  const hasResumePoint =
    resumePointQuery.data && !resumePointQuery.data.isCompleted && resumePointQuery.data.positionSeconds > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="muted">{metadata?.animeTitle}</Text>
        <Heading level="h2">
          T{metadata?.seasonNumber} · Ep. {metadata?.episodeNumber} — {metadata?.title}
        </Heading>
        {hasResumePoint ? (
          <Text variant="muted">
            Ibas por el minuto {formatMinutes(resumePointQuery.data!.positionSeconds)} — el
            reproductor es de un proveedor externo, retoma manualmente desde sus controles.
          </Text>
        ) : null}
      </div>

      {currentSource ? (
        <VideoPlayer src={currentSource.url} title={`${metadata?.animeTitle} — ${metadata?.title}`} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <SourceSelector
          sources={sources}
          value={currentSource?.id ?? null}
          onChange={handleSourceChange}
        />
        <SubtitleSelector
          subtitles={currentSource?.subtitles ?? []}
          value={subtitleLanguage}
          onChange={handleSubtitleChange}
        />
      </div>

      <EpisodeNavigation previous={previousQuery.data} next={nextQuery.data} />
    </div>
  );
}

export { WatchPageClient };
