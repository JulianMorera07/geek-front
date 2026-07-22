import { Suspense } from 'react';

import { Container } from '@/components/layout/container';
import { Heading } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLoader } from '@/components/base/loading';
import { GuestGuard } from '@/features/auth/components/guest-guard';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <GuestGuard>
      <Container size="narrow" className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <Heading level="h3">Iniciar sesión</Heading>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SectionLoader />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </Container>
    </GuestGuard>
  );
}
