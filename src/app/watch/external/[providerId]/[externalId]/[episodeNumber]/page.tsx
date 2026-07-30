import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { ExternalWatchPageClient } from '@/features/playback/components/external-watch-page-client';

export default async function ExternalWatchPage({
  params,
}: {
  params: Promise<{ providerId: string; externalId: string; episodeNumber: string }>;
}) {
  const { providerId, externalId, episodeNumber } = await params;

  return (
    <Container className="flex flex-col gap-4 py-6">
      <Button variant="ghost" className="w-fit" render={<Link href="/latest" />}>
        <ChevronLeftIcon />
        Volver
      </Button>
      <ExternalWatchPageClient
        providerId={providerId}
        externalId={externalId}
        episodeNumber={Number(episodeNumber)}
      />
    </Container>
  );
}
