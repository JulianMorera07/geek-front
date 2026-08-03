'use client';

import * as React from 'react';
import { PlayCircleIcon } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorView } from '@/components/base/error-view';
import { EmptyState } from '@/components/base/empty-state';
import { Heading, Text } from '@/components/base/typography';
import {
  useCreatePlaybackSessionMutation,
  usePlaybackResumePointQuery,
  useSavePlaybackProgressMutation,
  useSelectPlaybackQualityMutation,
  useSelectPlaybackSourceMutation,
  useSelectPlaybackSubtitleMutation,
} from '@/features/playback/api/queries';
import { VideoPlayer } from '@/features/playback/components/video-player';
import { NextEpisodePrompt } from '@/features/playback/components/next-episode-prompt';
import { LanguageSelector } from '@/features/playback/components/language-selector';
import { SourceSelector } from '@/features/playback/components/source-selector';
import { SubtitleSelector } from '@/features/playback/components/subtitle-selector';
import { EpisodeNavigation } from '@/features/playback/components/episode-navigation';
import { getStoredSessionId, storeSessionId } from '@/features/playback/session-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { isNotFoundError } from '@/lib/api-error';
import type { AdjacentEpisode, EpisodePlayback, PlaybackSource } from '@/features/playback/api/types';

const PROGRESS_SAVE_INTERVAL_MS = 10_000;
/** Estimado de respaldo SOLO para el `durationSeconds` reportado a `saveProgress` (no para disparar el aviso de fin) cuando no hay ninguna duración conocida. */
const DEFAULT_EPISODE_DURATION_SECONDS = 24 * 60;
/** Margen antes del fin real/estimado para disparar el aviso — evita que se dispare justo en el último segundo. */
const END_THRESHOLD_MARGIN_SECONDS = 5;

/**
 * El mensaje de error del backend puede nombrar el proveedor externo real
 * (ej. "Rate limit excedido para el provider 'tioanime'") — no queremos
 * exponer marcas de terceros en la UI. Genérico a propósito (no hardcodea
 * "tioanime"/"jkanime") para que siga funcionando si el backend agrega o
 * cambia proveedores sin avisar.
 */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/\bel provider ['"][^'"]*['"]/gi, 'el proveedor')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export interface EpisodePlayerProps {
  /**
   * Clave estable para persistir/reutilizar la sesión en `localStorage`,
   * disponible ANTES de que carguen los datos del episodio (a diferencia del
   * `episodeId` real, que en el flujo externo solo se conoce una vez resuelve
   * `playbackQuery`). Ruta interna: el `episodeId` de catálogo. Ruta externa:
   * `providerId:externalId:episodeNumber`.
   */
  watchKey: string;
  playbackQuery: UseQueryResult<EpisodePlayback, Error>;
  /** Sin navegación entre episodios si se omiten. */
  previous?: AdjacentEpisode | null;
  next?: AdjacentEpisode | null;
  /**
   * Último respaldo para el umbral de "episodio terminado" cuando ni
   * `metadata.skipIntervals` (ending) ni `metadata.durationSeconds` traen
   * dato — la duración del catálogo interno (`Episode.durationMinutes`).
   * Solo disponible en el flujo interno (con animeId). Si tampoco hay esto,
   * el aviso no se dispara por tiempo (ver lógica en el efecto de progreso).
   */
  durationSecondsHint?: number | null;
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
 *
 * Compartido entre el flujo interno (`WatchPageClient`, catálogo) y el
 * externo (`ExternalWatchPageClient`, directo desde un resultado de
 * `/latest`) — solo cambia de dónde sale `playbackQuery` y si hay
 * navegación entre episodios adyacentes disponible.
 */
function EpisodePlayer({
  watchKey,
  playbackQuery,
  previous,
  next,
  durationSecondsHint,
}: EpisodePlayerProps) {
  const createSession = useCreatePlaybackSessionMutation();
  const selectSource = useSelectPlaybackSourceMutation();
  const selectQuality = useSelectPlaybackQualityMutation();
  const selectSubtitle = useSelectPlaybackSubtitleMutation();
  const saveProgress = useSavePlaybackProgressMutation();

  const [manualLanguage, setManualLanguage] = React.useState<string | null>(null);
  const [manualSourceId, setManualSourceId] = React.useState<string | null>(null);
  const [manualSubtitle, setManualSubtitle] = React.useState<{
    sourceId: string;
    languageCode: string | null;
  } | null>(null);
  const [trackedWatchKey, setTrackedWatchKey] = React.useState(watchKey);
  // Arranca siempre en `null` (igual en servidor y en el primer render de
  // hidratación en cliente) y se sincroniza con `localStorage` en un efecto
  // aparte, después del montaje. Leer `localStorage` directo en el
  // inicializador de `useState` produce un valor distinto en SSR (`null`,
  // `window` no existe) vs. la hidratación en cliente (el valor real
  // guardado), lo que React detecta como mismatch y tumba toda la página con
  // el error #418 sin dejar rastro en consola aparte de ese código minificado.
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [episodeEnded, setEpisodeEnded] = React.useState(false);
  const sessionRequestedForRef = React.useRef<string | null>(null);
  const elapsedSecondsRef = React.useRef(0);
  const lastSaveRef = React.useRef(0);
  const endedNotifiedRef = React.useRef(false);

  React.useEffect(() => {
    setSessionId(getStoredSessionId(watchKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; el cambio de episodio ya se maneja en el ajuste de estado de abajo.
  }, []);

  // Reinicia selección manual + sesión al cambiar de episodio (ajuste de
  // estado durante el render, no en un efecto — ver nota de más abajo).
  if (trackedWatchKey !== watchKey) {
    setTrackedWatchKey(watchKey);
    setManualLanguage(null);
    setManualSourceId(null);
    setManualSubtitle(null);
    setSessionId(getStoredSessionId(watchKey));
    setEpisodeEnded(false);
    endedNotifiedRef.current = false;
  }

  const isMobile = useIsMobile();
  const allSources = playbackQuery.data?.sources ?? [];
  // Los embeds de mega.nz no cargan bien en navegadores móviles (confirmado
  // por el usuario) — se ocultan solo ahí, no en desktop. Si TODAS las
  // fuentes fueran de mega, se muestran de todos modos (mejor una fuente que
  // ninguna) — el filtro es una preferencia, no una garantía de que sobre
  // otra opción.
  const nonMegaSources = allSources.filter((s) => !s.url.includes('mega.nz'));
  const sources = isMobile && nonMegaSources.length > 0 ? nonMegaSources : allSources;
  const defaultSource = sources.find((s) => s.isActive) ?? sources[0];

  // Idiomas de audio distintos disponibles entre las fuentes (orden de
  // aparición). El selector de idioma filtra qué fuentes puede ofrecer
  // `SourceSelector` — separa "qué idioma quiero" de "qué servidor uso".
  const availableLanguages = Array.from(
    new Set(sources.map((s) => s.audio.languageCode).filter((code): code is string => Boolean(code))),
  );
  const defaultLanguage = defaultSource?.audio.languageCode ?? sources[0]?.audio.languageCode ?? null;
  const selectedLanguage = manualLanguage ?? defaultLanguage;
  const sourcesForLanguage = selectedLanguage
    ? sources.filter((s) => s.audio.languageCode === selectedLanguage)
    : sources;

  const currentSource: PlaybackSource | undefined =
    sourcesForLanguage.find((s) => s.id === manualSourceId) ??
    sourcesForLanguage.find((s) => s.isActive) ??
    sourcesForLanguage[0];
  const defaultSubtitleLanguage =
    currentSource?.subtitles.find((s) => s.isDefault)?.languageCode ?? null;
  const subtitleLanguage =
    manualSubtitle && manualSubtitle.sourceId === currentSource?.id
      ? manualSubtitle.languageCode
      : defaultSubtitleLanguage;

  const episodeId = playbackQuery.data?.episodeId;

  // Crea una sesión nueva solo si no había una guardada para este episodio.
  React.useEffect(() => {
    if (!episodeId || sources.length === 0) return;
    if (sessionId) return;
    if (sessionRequestedForRef.current === watchKey) return;
    sessionRequestedForRef.current = watchKey;
    createSession.mutate(episodeId, {
      onSuccess: (created) => {
        storeSessionId(watchKey, created.id);
        setSessionId(created.id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara una sola vez por watchKey sin sesión guardada, no en cada cambio de `createSession`.
  }, [episodeId, watchKey, sources.length, sessionId]);

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
  //
  // Nota: `source.directUrl` existe en el tipo por compatibilidad con el
  // backend, pero ya NO se usa para reproducir — un `<video>` propio
  // apuntando directo al CDN del proveedor rompía la reproducción a mitad de
  // episodio (esos CDNs protegen sus fragmentos con Referer/Origin del sitio
  // original o URLs de expiración corta, y rechazaban los fragmentos pedidos
  // desde nuestro dominio). Deshabilitado hasta que haya un proxy en el
  // backend que reenvíe los headers correctos por proveedor.
  React.useEffect(() => {
    if (!sessionId || !currentSource) return;
    elapsedSecondsRef.current =
      resumePointQuery.data && !resumePointQuery.data.isCompleted
        ? resumePointQuery.data.positionSeconds
        : 0;
    endedNotifiedRef.current = false;
    setEpisodeEnded(false);
    const realDurationSeconds = playbackQuery.data?.metadata.durationSeconds ?? null;
    const skipIntervals = playbackQuery.data?.metadata.skipIntervals ?? [];
    const endingStartSeconds = skipIntervals.find((s) => s.kind === 'ed')?.startSeconds ?? null;
    // Umbral para el aviso de "episodio terminado", en orden de precisión
    // (recomendado por backend): el ending detectado por AniSkip es la señal
    // más confiable de dónde termina el contenido real (arranca justo cuando
    // empieza/termina el ending) > duración real del episodio (AniSkip o
    // estimado de jkanime, con un margen) > duración del catálogo interno
    // como último respaldo. Si no hay NINGUNO de los tres, no se puede saber
    // el final por tiempo — el aviso no se dispara (`endThresholdSeconds`
    // queda inalcanzable); solo quedaría el evento nativo "video terminó" del
    // player, que no existe acá por ser un iframe cross-origin.
    const endThresholdSeconds =
      endingStartSeconds ??
      (realDurationSeconds != null
        ? realDurationSeconds - END_THRESHOLD_MARGIN_SECONDS
        : durationSecondsHint != null
          ? durationSecondsHint - END_THRESHOLD_MARGIN_SECONDS
          : Infinity);
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 1;

      if (!endedNotifiedRef.current && elapsedSecondsRef.current >= endThresholdSeconds) {
        endedNotifiedRef.current = true;
        setEpisodeEnded(true);
      }

      const now = Date.now();
      if (now - lastSaveRef.current < PROGRESS_SAVE_INTERVAL_MS) return;
      lastSaveRef.current = now;
      // Sin duración real (habitual: el backend no la conoce para fuentes
      // externas), se usa un estimado generoso de episodio de anime — nunca
      // `elapsed + 1`, que dejaría el porcentaje siempre en ~100% y el
      // backend marcaría la sesión como completada casi al instante.
      const durationSeconds =
        realDurationSeconds ?? Math.max(DEFAULT_EPISODE_DURATION_SECONDS, elapsedSecondsRef.current + 60);
      saveProgress.mutate({
        sessionId,
        positionSeconds: elapsedSecondsRef.current,
        durationSeconds,
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arranca el timer al cambiar de sesión/fuente o al llegar el resume point; no en cada cambio de `saveProgress`.
  }, [sessionId, currentSource?.id, resumePointQuery.data]);

  function handleLanguageChange(languageCode: string) {
    setManualLanguage(languageCode);
    // Al cambiar de idioma, el servidor/subtítulo elegidos a mano ya no
    // aplican necesariamente (pueden pertenecer al idioma anterior) — se
    // recalculan al valor por defecto del nuevo idioma.
    setManualSourceId(null);
    setManualSubtitle(null);
  }

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
        // El backend ya manda un mensaje específico y accionable (ej. "Rate
        // limit excedido...") — mostrarlo es más útil que un texto genérico
        // fijo, pero saneado para no exponer el nombre del proveedor externo.
        description={sanitizeErrorMessage(playbackQuery.error.message)}
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
        <div className="relative">
          <VideoPlayer src={currentSource.url} title={`${metadata?.animeTitle} — ${metadata?.title}`} />
          {episodeEnded && next ? (
            <NextEpisodePrompt next={next} onCancel={() => setEpisodeEnded(false)} />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <LanguageSelector
          languages={availableLanguages}
          value={selectedLanguage}
          onChange={handleLanguageChange}
        />
        <SourceSelector
          sources={sourcesForLanguage}
          value={currentSource?.id ?? null}
          onChange={handleSourceChange}
        />
        <SubtitleSelector
          subtitles={currentSource?.subtitles ?? []}
          value={subtitleLanguage}
          onChange={handleSubtitleChange}
        />
      </div>

      <EpisodeNavigation previous={previous} next={next} />
    </div>
  );
}

export { EpisodePlayer };
