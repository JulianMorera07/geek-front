'use client';

import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionLoader } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { ProfileForm } from '@/features/auth/components/profile-form';
import { PermissionGuard } from '@/features/auth/components/permission-guard';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <SectionLoader />;

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Perfil</Heading>
        <Text variant="muted">
          {user.email} · @{user.username}
        </Text>
        <div className="mt-1 flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.id} variant="secondary">
              {role.name}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información pública</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <PermissionGuard permission="admin:manage">
        <Card>
          <CardHeader>
            <CardTitle>Administración</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="muted">
              Tenés el permiso <code>admin:manage</code> — acá viviría el panel de administración
              (gestión de usuarios/roles) en un sprint futuro.
            </Text>
          </CardContent>
        </Card>
      </PermissionGuard>
    </Container>
  );
}
