const STORAGE_PREFIX = 'geekbaku:playback-session:';

/**
 * Persiste el `sessionId` de reproducción por episodio en `localStorage` —
 * funciona igual logueado o no (las sesiones de playback son anónimas del
 * lado del backend; esto es lo que permite retomar un episodio en la misma
 * pestaña/navegador sin depender de la sesión de auth). Sin esto, cada visita
 * crea una sesión nueva y el resume point real (guardado en la sesión
 * anterior) queda inalcanzable.
 */
export function getStoredSessionId(episodeId: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + episodeId);
  } catch {
    return null;
  }
}

export function storeSessionId(episodeId: string, sessionId: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + episodeId, sessionId);
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no crítico.
  }
}
