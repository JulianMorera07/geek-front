import { Container } from '@/components/layout/container';
import { SearchPageClient } from '@/features/anime/components/search-page-client';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Container className="py-6">
      <SearchPageClient initialQuery={q ?? ''} />
    </Container>
  );
}
