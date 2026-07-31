const STORAGE_PREFIX = 'geekbaku:continue-watching:';

export interface ContinueWatchingEntry {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Último episodio visto por anime (distinto del `sessionId` por episodio de
 * `session-storage.ts`, que sirve para retomar el minuto exacto DENTRO de un
 * episodio) — esto es lo que permite mostrar "Ibas por T1 · Ep. 5" al volver
 * a la ficha del anime, sin haber entrado antes al reproductor. Anónimo,
 * funciona igual logueado o no.
 */
export function getContinueWatching(animeId: string): ContinueWatchingEntry | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + animeId);
    return raw ? (JSON.parse(raw) as ContinueWatchingEntry) : null;
  } catch {
    return null;
  }
}

export function storeContinueWatching(animeId: string, entry: ContinueWatchingEntry): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + animeId, JSON.stringify(entry));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no crítico.
  }
}
