import { Container } from '@/components/layout/container';
import { Heading } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestGuard } from '@/features/auth/components/guest-guard';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <GuestGuard>
      <Container size="narrow" className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <Heading level="h3">Crear cuenta</Heading>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </Container>
    </GuestGuard>
  );
}
