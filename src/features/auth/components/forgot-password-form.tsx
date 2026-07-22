'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/base/form-field';
import { EmptyState } from '@/components/base/empty-state';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';

/**
 * El backend (módulo Identity) todavía no expone `forgot-password`/`reset-password`
 * — no existe ningún endpoint para esto (confirmado contra el OpenAPI real).
 * La UI queda lista y funcional; al enviar, se informa claramente que la
 * funcionalidad está pendiente del backend en vez de simular un éxito falso.
 * Conectar cuando el endpoint exista: reemplazar el `setSubmitted(true)` de
 * `onSubmit` por la llamada real — el formulario no necesita cambios.
 */
function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  function onSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <EmptyState
        icon={<MailIcon className="size-6" />}
        title="Todavía no disponible"
        description="La recuperación de contraseña está pendiente del lado del backend. Por ahora, contacta a soporte si perdiste el acceso a tu cuenta."
        action={
          <Button variant="outline" render={<Link href="/login" />} className="mt-2">
            Volver a iniciar sesión
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="forgot-email" error={errors.email?.message}>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        Enviar instrucciones
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export { ForgotPasswordForm };
