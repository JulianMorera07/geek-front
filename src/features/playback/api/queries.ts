'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createPlaybackSession,
  fetchEpisodePlayback,
  fetchExternalEpisodePlayback,
  fetchNextEpisode,
  fetchPlaybackResumePoint,
  fetchPreviousEpisode,
  savePlaybackProgress,
  selectPlaybackQuality,
  selectPlaybackSource,
  selectPlaybackSubtitle,
} from '@/features/playback/api/http-client';

export const playbackKeys = {
  all: ['playback'] as const,
  episode: (animeId: string, episodeId: string) =>
    [...playbackKeys.all, 'episode', animeId, episodeId] as const,
  externalEpisode: (providerId: string, externalId: string, episodeNumber: number) =>
    [...playbackKeys.all, 'external-episode', providerId, externalId, episodeNumber] as const,
  adjacent: (animeId: string, seasonNumber: number, episodeNumber: number, dir: 'next' | 'prev') =>
    [...playbackKeys.all, 'adjacent', dir, animeId, seasonNumber, episodeNumber] as const,
  resumePoint: (sessionId: string) => [...playbackKeys.all, 'resume-point', sessionId] as const,
};

/** Metadata + fuentes + calidades disponibles de un episodio (catálogo interno). */
export function useEpisodePlaybackQuery(animeId: string, episodeId: string) {
  return useQuery({
    queryKey: playbackKeys.episode(animeId, episodeId),
    queryFn: () => fetchEpisodePlayback(animeId, episodeId),
    staleTime: 60_000,
  });
}

/** Igual que `useEpisodePlaybackQuery`, pero para un episodio resuelto directo desde un resultado de `/latest` (sin pasar primero por la ficha del anime). */
export function useExternalEpisodePlaybackQuery(
  providerId: string,
  externalId: string,
  episodeNumber: number,
) {
  return useQuery({
    queryKey: playbackKeys.externalEpisode(providerId, externalId, episodeNumber),
    queryFn: () => fetchExternalEpisodePlayback(providerId, externalId, episodeNumber),
    staleTime: 60_000,
  });
}

export function useNextEpisodeQuery(
  animeId: string,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined,
) {
  return useQuery({
    queryKey: playbackKeys.adjacent(animeId, seasonNumber ?? 0, episodeNumber ?? 0, 'next'),
    queryFn: () => fetchNextEpisode(animeId, seasonNumber!, episodeNumber!),
    enabled: seasonNumber !== undefined && episodeNumber !== undefined,
    staleTime: 60_000,
  });
}

export function usePreviousEpisodeQuery(
  animeId: string,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined,
) {
  return useQuery({
    queryKey: playbackKeys.adjacent(animeId, seasonNumber ?? 0, episodeNumber ?? 0, 'prev'),
    queryFn: () => fetchPreviousEpisode(animeId, seasonNumber!, episodeNumber!),
    enabled: seasonNumber !== undefined && episodeNumber !== undefined,
    staleTime: 60_000,
  });
}

export function useCreatePlaybackSessionMutation() {
  return useMutation({ mutationFn: (episodeId: string) => createPlaybackSession(episodeId) });
}

export function useSelectPlaybackSourceMutation() {
  return useMutation({
    mutationFn: ({ sessionId, sourceId }: { sessionId: string; sourceId: string }) =>
      selectPlaybackSource(sessionId, sourceId),
  });
}

export function useSelectPlaybackQualityMutation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      quality,
    }: {
      sessionId: string;
      quality: Parameters<typeof selectPlaybackQuality>[1];
    }) => selectPlaybackQuality(sessionId, quality),
  });
}

export function useSelectPlaybackSubtitleMutation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      languageCode,
      languageName,
    }: {
      sessionId: string;
      languageCode: string | null;
      languageName: string | null;
    }) => selectPlaybackSubtitle(sessionId, languageCode, languageName),
  });
}

export function useSavePlaybackProgressMutation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      positionSeconds,
      durationSeconds,
    }: {
      sessionId: string;
      positionSeconds: number;
      durationSeconds: number;
    }) => savePlaybackProgress(sessionId, positionSeconds, durationSeconds),
  });
}

export function usePlaybackResumePointQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: playbackKeys.resumePoint(sessionId ?? ''),
    queryFn: () => fetchPlaybackResumePoint(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: Infinity,
  });
}
