const STORAGE_PREFIX = 'geekbaku:continue-watching:';

export interface ContinueWatchingEntry {
  animeTitle: string;
  thumbnailUrl: string | null;
  /** Ya resuelto por quien guarda — funciona tanto para el flujo interno (`/anime/:id/watch/:episodeId`) como el externo (`/watch/external/...`). */
  href: string;
  seasonNumber: number;
  episodeNumber: number;
  updatedAt: number;
}

/**
 * El formato guardado cambió (antes tenía `episodeId`, sin `href`/`animeTitle`
 * ni `updatedAt`) — sin esta validación, una entrada vieja en `localStorage`
 * de un usuario que ya usó el sitio antes de este cambio se leía con
 * `href: undefined`, y el `<Link href={undefined}>` del banner de Home tumbaba
 * toda la página (confirmado en vivo: Home entero caía al error boundary).
 */
function isValidEntry(value: unknown): value is ContinueWatchingEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.href === 'string' &&
    v.href.length > 0 &&
    typeof v.animeTitle === 'string' &&
    typeof v.seasonNumber === 'number' &&
    typeof v.episodeNumber === 'number' &&
    typeof v.updatedAt === 'number'
  );
}

/**
 * Último episodio visto por serie (distinto del `sessionId` por episodio de
 * `session-storage.ts`, que sirve para retomar el minuto exacto DENTRO de un
 * episodio) — esto es lo que permite mostrar "Ibas por T1 · Ep. 5" al volver
 * a la ficha del anime o a la Home, sin haber entrado antes al reproductor.
 * Anónimo, funciona igual logueado o no. `key` es opaco: el flujo interno usa
 * el `animeId` del catálogo, el externo usa `providerId:externalId`.
 */
export function getContinueWatching(key: string): ContinueWatchingEntry | null {
  try {
    const storageKey = STORAGE_PREFIX + key;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidEntry(parsed)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeContinueWatching(key: string, entry: Omit<ContinueWatchingEntry, 'updatedAt'>): void {
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({ ...entry, updatedAt: Date.now() } satisfies ContinueWatchingEntry),
    );
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no crítico.
  }
}

/** El más reciente entre todas las series con progreso guardado — para el aviso "Continuar viendo" de la Home, que no sabe de antemano qué serie fue la última. */
export function getMostRecentContinueWatching(): ContinueWatchingEntry | null {
  try {
    let latest: ContinueWatchingEntry | null = null;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!isValidEntry(parsed)) {
        window.localStorage.removeItem(key);
        continue;
      }
      if (!latest || parsed.updatedAt > latest.updatedAt) latest = parsed;
    }
    return latest;
  } catch {
    return null;
  }
}
