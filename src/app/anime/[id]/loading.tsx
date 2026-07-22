import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';
import { EpisodeListSkeleton } from '@/features/anime/components/skeletons';

export default function AnimeDetailLoading() {
  return (
    <Container className="flex flex-col gap-10 py-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <Skeleton className="aspect-2/3 w-full max-w-64 rounded-lg sm:w-56" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full max-w-2xl" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <EpisodeListSkeleton />
      </div>
    </Container>
  );
}
