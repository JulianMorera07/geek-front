import { Container } from '@/components/layout/container';
import { ErrorView } from '@/components/base/error-view';
import { DiscoveryBanner } from '@/features/anime/components/discovery-banner';
import { OngoingList } from '@/features/anime/components/ongoing-list';
import { DiscoveryRow } from '@/features/anime/components/discovery-row';
import {
  fetchCatalog,
  fetchLatest,
  fetchNewAnimes,
  fetchPopular,
} from '@/features/anime/api/http-client';
import type { AnimeSummary, DiscoveryResult } from '@/features/anime/api/types';

/**
 * Home combina dos fuentes reales distintas (ver `docs/api-integration.md`):
 * catálogo interno (`ongoing`, clickable a Detalle) + Provider Framework
 * (`popular`/`latest`/`new-animes`, solo informativo). Cada sección se pide
 * por separado y degrada de forma independiente — si el catálogo interno
 * falla (ej. el adapter de base de datos todavía no está listo), las filas
 * de discovery igual se muestran, y viceversa.
 *
 * Orden de las filas (decisión de producto, no técnica): últimos capítulos
 * primero (lo más "vivo" del sitio, debajo del carrusel), luego novedades de
 * series por tipo, y populares al final — ver conversación del 2026-07-30.
 */
export default async function HomePage() {
  const [ongoing, popular, latest, newAnimes, newMovies, newOvas, newSpecials] =
    await Promise.all([
      fetchCatalog({ status: 'ongoing', pageSize: 12 }).catch((error) => {
        console.error('[HomePage] fetchCatalog (catálogo interno) falló:', error);
        return null;
      }),
      fetchPopular({ pageSize: 12 }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchPopular falló:', error);
        return [];
      }),
      fetchLatest({ pageSize: 12 }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchLatest falló:', error);
        return [];
      }),
      fetchNewAnimes({ pageSize: 12 }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchNewAnimes falló:', error);
        return [];
      }),
      fetchNewAnimes({ pageSize: 12, type: 'Movie' }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchNewAnimes (Movie) falló:', error);
        return [];
      }),
      fetchNewAnimes({ pageSize: 12, type: 'OVA' }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchNewAnimes (OVA) falló:', error);
        return [];
      }),
      fetchNewAnimes({ pageSize: 12, type: 'Special' }).catch((error): DiscoveryResult[] => {
        console.error('[HomePage] fetchNewAnimes (Special) falló:', error);
        return [];
      }),
    ]);

  const ongoingAnimes: AnimeSummary[] = ongoing?.items ?? [];

  return (
    <Container className="flex flex-col gap-10 py-6">
      {!ongoing ? (
        <ErrorView
          title="No pudimos cargar el catálogo"
          description="El catálogo interno no respondió. Las secciones de abajo son independientes y pueden seguir funcionando."
        />
      ) : null}

      <div className="flex flex-col-reverse gap-6 lg:flex-row">
        <OngoingList animes={ongoingAnimes} className="lg:w-64 lg:shrink-0" />
        <DiscoveryBanner results={newAnimes.slice(0, 4)} className="flex-1" />
      </div>

      <DiscoveryRow title="Últimos capítulos" results={latest} viewAllHref="/latest" />
      <DiscoveryRow title="Nuevos animes" results={newAnimes} />
      <DiscoveryRow title="Películas nuevas" results={newMovies} />
      <DiscoveryRow title="Ovas nuevas" results={newOvas} />
      <DiscoveryRow title="Especiales nuevos" results={newSpecials} />
      <DiscoveryRow title="Populares" results={popular} viewAllHref="/popular" />
    </Container>
  );
}
