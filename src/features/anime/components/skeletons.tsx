import { Skeleton } from '@/components/ui/skeleton';
import { Grid } from '@/components/base/grid';

/** Skeleton de `AnimeCard` — mismas proporciones (poster 2:3 + 2 líneas de texto). */
function AnimeCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Skeleton className="aspect-2/3 w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

/** Skeleton de `EpisodeCard` — thumbnail 16:9 + texto. */
function EpisodeCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="aspect-video w-32 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/** Skeleton de `GenreCard` — bloque 16:9. */
function GenreCardSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-lg" />;
}

/** Skeleton de `Banner` — hero completo. */
function BannerSkeleton() {
  return <Skeleton className="aspect-[16/10] w-full rounded-xl sm:aspect-[21/9]" />;
}

/** Fila de `AnimeCardSkeleton` — mismo layout que `AnimeRow`. */
function AnimeRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="w-36 shrink-0 sm:w-44">
            <AnimeCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid de `AnimeCardSkeleton` — mismo layout que `AnimeGrid`. */
function AnimeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Grid columns="cards">
      {Array.from({ length: count }, (_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </Grid>
  );
}

/** Grid de `EpisodeCardSkeleton` — mismo layout que `EpisodeList`. */
function EpisodeListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid columns="wide">
      {Array.from({ length: count }, (_, i) => (
        <EpisodeCardSkeleton key={i} />
      ))}
    </Grid>
  );
}

export {
  AnimeCardSkeleton,
  EpisodeCardSkeleton,
  GenreCardSkeleton,
  BannerSkeleton,
  AnimeRowSkeleton,
  AnimeGridSkeleton,
  EpisodeListSkeleton,
};
