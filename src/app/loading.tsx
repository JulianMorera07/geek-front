import { Container } from '@/components/layout/container';
import { BannerSkeleton, AnimeRowSkeleton } from '@/features/anime/components/skeletons';

export default function HomeLoading() {
  return (
    <Container className="flex flex-col gap-10 py-6">
      <BannerSkeleton />
      <AnimeRowSkeleton />
      <AnimeRowSkeleton />
      <AnimeRowSkeleton />
    </Container>
  );
}
