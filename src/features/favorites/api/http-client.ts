import { httpRequest, resolveApiBaseUrl } from '@/lib/http';
import type { FavoriteEntry } from '@/features/favorites/api/types';

const API_BASE_URL = resolveApiBaseUrl();

interface RawFavoriteEntry {
  anime_id: string;
  created_at: string;
}

function mapFavoriteEntry(raw: RawFavoriteEntry): FavoriteEntry {
  return { animeId: raw.anime_id, createdAt: raw.created_at };
}

/** GET /favorites — requiere sesión. */
export async function fetchFavorites(accessToken: string): Promise<FavoriteEntry[]> {
  const raw = await httpRequest<RawFavoriteEntry[]>(`${API_BASE_URL}/favorites`, { accessToken });
  return raw.map(mapFavoriteEntry);
}

/** POST /favorites — requiere sesión. */
export async function addFavorite(accessToken: string, animeId: string): Promise<void> {
  await httpRequest<void>(`${API_BASE_URL}/favorites`, {
    method: 'POST',
    accessToken,
    body: { anime_id: animeId },
  });
}

/** DELETE /favorites/:animeId — requiere sesión. */
export async function removeFavorite(accessToken: string, animeId: string): Promise<void> {
  await httpRequest<void>(`${API_BASE_URL}/favorites/${encodeURIComponent(animeId)}`, {
    method: 'DELETE',
    accessToken,
  });
}
