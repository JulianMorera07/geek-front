import { notFound, redirect } from 'next/navigation';

import { fetchAnimeByExternalReference } from '@/features/anime/api/http-client';
import { PersistCoverAndRedirect } from '@/features/anime/components/persist-cover-and-redirect';
import { isNotFoundError } from '@/lib/api-error';

/**
 * Puente entre un resultado externo (`/search`, `/latest`, `/popular` — sin
 * `id` propio) y el catálogo interno. Ingiere el anime si hace falta (puede
 * tardar, ver `EXTERNAL_INGEST_TIMEOUT_MS`) y redirige a la ficha real. Este
 * es el único destino al que deben apuntar los clicks sobre `DiscoveryCard`.
 *
 * `thumbnail` (query string): la miniatura que sí tenía el resultado de
 * búsqueda original — el backend la descarta al ingerir (`thumbnail_url`
 * queda `null` en el detalle persistido, gap confirmado en vivo). Si el
 * detalle resuelto no trae imagen propia pero sí llegó esta, se cachea en
 * `localStorage` antes de continuar (ver `cover-cache.ts`).
 */
export default async function ExternalAnimeBridgePage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string; externalId: string }>;
  searchParams: Promise<{ thumbnail?: string }>;
}) {
  const { providerId, externalId } = await params;
  const { thumbnail } = await searchParams;

  let anime;
  try {
    anime = await fetchAnimeByExternalReference(providerId, externalId);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  if (!anime.thumbnailUrl && thumbnail) {
    return <PersistCoverAndRedirect animeId={anime.id} coverUrl={thumbnail} />;
  }

  redirect(`/anime/${anime.id}`);
}
