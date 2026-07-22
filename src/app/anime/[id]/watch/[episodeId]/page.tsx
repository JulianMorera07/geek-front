import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { WatchPageClient } from '@/features/playback/components/watch-page-client';

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}) {
  const { id, episodeId } = await params;

  return (
    <Container className="flex flex-col gap-4 py-6">
      <Button variant="ghost" className="w-fit" render={<Link href={`/anime/${id}`} />}>
        <ChevronLeftIcon />
        Volver al anime
      </Button>
      <WatchPageClient animeId={id} episodeId={episodeId} />
    </Container>
  );
}
