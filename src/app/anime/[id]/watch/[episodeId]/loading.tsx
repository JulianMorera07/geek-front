import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function WatchLoading() {
  return (
    <Container className="flex flex-col gap-4 py-6">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
    </Container>
  );
}
