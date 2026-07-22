import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestGuard } from '@/features/auth/components/guest-guard';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <Container size="narrow" className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <Heading level="h3">Recuperar contraseña</Heading>
            </CardTitle>
            <Text variant="muted">Te enviaremos instrucciones a tu email.</Text>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </Container>
    </GuestGuard>
  );
}
