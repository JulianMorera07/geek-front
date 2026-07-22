const PREFIX = 'geekbaku:anime-cover:';

/**
 * Cache en `localStorage` de la miniatura real de un anime, por `id` interno.
 *
 * Gap conocido del backend: el resultado de `/search` sí trae `thumbnail_url`,
 * pero al ingerirlo (`GET /anime/external/:providerId/:externalId`) el
 * detalle persistido queda con `thumbnail_url: null` — la imagen se pierde en
 * el momento de la ingesta (confirmado en vivo, ver docs/api-integration.md).
 * El puente de ingesta guarda acá la miniatura que sí tenía el resultado de
 * búsqueda justo antes de perderse, para que Detalle/las cards de catálogo la
 * sigan mostrando.
 */
export function getCachedCover(animeId: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + animeId);
  } catch {
    return null;
  }
}

export function setCachedCover(animeId: string, url: string): void {
  try {
    window.localStorage.setItem(PREFIX + animeId, url);
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — no crítico.
  }
}
