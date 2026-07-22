'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/base/form-field';
import { Spinner } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas';
import { ApiError, isConflictError } from '@/lib/api-error';

/** Registro. El backend no devuelve tokens en `/auth/register` — `useAuth().register` hace login después. */
function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerUser(values);
      router.replace('/');
    } catch (error) {
      if (isConflictError(error)) {
        setError('email', { message: 'Ya existe una cuenta con ese email.' });
        return;
      }
      const message = error instanceof ApiError ? error.message : 'No pudimos crear tu cuenta.';
      setError('root', { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="register-email" error={errors.email?.message}>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </FormField>

      <FormField label="Usuario" htmlFor="register-username" error={errors.username?.message}>
        <Input
          id="register-username"
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          {...register('username')}
        />
      </FormField>

      <FormField
        label="Contraseña"
        htmlFor="register-password"
        error={errors.password?.message}
        hint={!errors.password ? 'Mínimo 8 caracteres, con letras y números.' : undefined}
      >
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
      </FormField>

      <FormField
        label="Confirmar contraseña"
        htmlFor="register-confirm-password"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
      </FormField>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Spinner size="sm" /> : null}
        Crear cuenta
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}

export { RegisterForm };
