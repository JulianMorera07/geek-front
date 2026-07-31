import type { DiscoveryResult } from '@/features/anime/api/types';

/**
 * El Provider Framework no da un id estable por resultado — se arma una
 * clave a partir de la primera fuente (provider+externalId), que sí es
 * estable, con fallback a título+año para resultados sin fuentes.
 */
function discoveryResultKey(result: DiscoveryResult): string {
  const primary = result.sources[0];
  return primary ? `${primary.providerId}:${primary.externalId}` : `${result.title}:${result.year}`;
}

/**
 * `/popular`, `/latest`, `/directory` y `/search` no soportan paginación real
 * más allá de lo que el proveedor tiene disponible: al pasar el límite,
 * algunos devuelven una página completa repitiendo los mismos resultados en
 * vez de una página corta o vacía. Sin este dedupe, el scroll infinito
 * duplicaba animes indefinidamente.
 */
export function dedupeDiscoveryResults(results: DiscoveryResult[]): DiscoveryResult[] {
  const seen = new Set<string>();
  const deduped: DiscoveryResult[] = [];
  for (const result of results) {
    const key = discoveryResultKey(result);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(result);
  }
  return deduped;
}

/** true si `page` no aporta ningún resultado nuevo respecto a `previousPages` — señal de que el proveedor ya no tiene más contenido. */
export function pageHasNewResults(page: DiscoveryResult[], previousPages: DiscoveryResult[][]): boolean {
  const seen = new Set(previousPages.flat().map(discoveryResultKey));
  return page.some((result) => !seen.has(discoveryResultKey(result)));
}
