import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGridSkeleton } from '@/features/anime/components/skeletons';

export default function SearchLoading() {
  return (
    <Container className="flex flex-col gap-6 py-6">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-full max-w-md" />
      <AnimeGridSkeleton />
    </Container>
  );
}
