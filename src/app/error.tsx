'use client';

import * as React from 'react';

import { Container } from '@/components/layout/container';
import { ErrorView } from '@/components/base/error-view';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16">
      <ErrorView onRetry={reset} />
    </Container>
  );
}
