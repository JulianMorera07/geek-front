'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addFavorite, fetchFavorites, removeFavorite } from '@/features/favorites/api/http-client';
import { authSessionManager } from '@/features/auth/session-manager';

export const favoritesKeys = {
  all: ['favorites'] as const,
};

/** `enabled` debe venir de `useAuth().isAuthenticated` — el endpoint exige sesión. */
export function useFavoritesQuery(enabled: boolean) {
  return useQuery({
    queryKey: favoritesKeys.all,
    queryFn: () => authSessionManager.callAuthenticated((token) => fetchFavorites(token)),
    enabled,
    staleTime: 30_000,
  });
}

/** `callAuthenticated` reintenta una vez con refresh de token si el access token venció — no hace falta manejarlo acá. */
export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (animeId: string) =>
      authSessionManager.callAuthenticated((token) => addFavorite(token, animeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesKeys.all }),
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (animeId: string) =>
      authSessionManager.callAuthenticated((token) => removeFavorite(token, animeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesKeys.all }),
  });
}
