'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/base/form-field';
import { Spinner } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';

/** Login. Al tener éxito, redirige a `?redirect=` si vino de un `AuthGuard`, si no a `/`. */
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      const redirect = searchParams.get('redirect');
      router.replace(redirect && redirect.startsWith('/') ? redirect : '/');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'No pudimos iniciar sesión.';
      setError('root', { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="login-email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </FormField>

      <FormField label="Contraseña" htmlFor="login-password" error={errors.password?.message}>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
      </FormField>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Spinner size="sm" /> : null}
        Iniciar sesión
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-foreground font-medium hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
