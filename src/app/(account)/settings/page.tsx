'use client';

import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLoader } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { SettingsForm } from '@/features/auth/components/settings-form';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return <SectionLoader />;

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Configuración</Heading>
        <Text variant="muted">Preferencias de idioma, tema y notificaciones.</Text>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>
    </Container>
  );
}
