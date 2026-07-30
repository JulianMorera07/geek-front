import { Container } from '@/components/layout/container';
import { Heading } from '@/components/base/typography';
import { ErrorView } from '@/components/base/error-view';
import { Banner } from '@/features/anime/components/banner';
import { DiscoveryBanner } from '@/features/anime/components/discovery-banner';
import { AnimeRow } from '@/features/anime/components/anime-row';
import { DiscoveryRow } from '@/features/anime/components/discovery-row';
import { GenreGrid } from '@/features/anime/components/genre-grid';
import {
  fetchCatalog,
  fetchGenres,
  fetchLatest,
  fetchNewAnimes,
  fetchPopular,
} from '@/features/anime/api/http-client';
import type { AnimeSummary, DiscoveryResult, Genre } from '@/features/anime/api/types';

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
  const [ongoing, popular, latest, newAnimes, newMovies, newOvas, newSpecials, genres] =
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
      fetchGenres().catch((error): Genre[] => {
        console.error('[HomePage] fetchGenres falló:', error);
        return [];
      }),
    ]);

  const ongoingAnimes: AnimeSummary[] = ongoing?.items ?? [];

  return (
    <Container className="flex flex-col gap-10 py-6">
      <DiscoveryBanner results={latest.slice(0, 4)} />

      {ongoing ? (
        ongoingAnimes.length > 0 ? (
          <>
            <Banner animes={ongoingAnimes} />
            <AnimeRow title="En emisión" animes={ongoingAnimes} />
          </>
        ) : null
      ) : (
        <ErrorView
          title="No pudimos cargar el catálogo"
          description="El catálogo interno no respondió. Las secciones de abajo son independientes y pueden seguir funcionando."
        />
      )}

      <DiscoveryRow title="Últimos capítulos" results={latest} viewAllHref="/latest" />
      <DiscoveryRow title="Nuevos animes" results={newAnimes} />
      <DiscoveryRow title="Películas nuevas" results={newMovies} />
      <DiscoveryRow title="Ovas nuevas" results={newOvas} />
      <DiscoveryRow title="Especiales nuevos" results={newSpecials} />
      <DiscoveryRow title="Populares" results={popular} viewAllHref="/popular" />

      {genres.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Heading level="h3">Explora por género</Heading>
          <GenreGrid genres={genres.slice(0, 6)} />
        </section>
      ) : null}
    </Container>
  );
}
