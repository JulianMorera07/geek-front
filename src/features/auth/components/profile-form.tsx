'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/base/form-field';
import { Spinner } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { profileSchema, type ProfileFormValues } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import type { User } from '@/features/auth/api/types';

function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.profile.displayName,
      avatarUrl: user.profile.avatarUrl ?? '',
      bio: user.profile.bio,
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateProfile({ ...values, avatarUrl: values.avatarUrl || undefined });
      toast.success('Perfil actualizado');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'No pudimos guardar tu perfil.';
      setError('root', { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField
        label="Nombre para mostrar"
        htmlFor="profile-display-name"
        error={errors.displayName?.message}
      >
        <Input id="profile-display-name" {...register('displayName')} />
      </FormField>

      <FormField
        label="URL de avatar"
        htmlFor="profile-avatar-url"
        error={errors.avatarUrl?.message}
      >
        <Input
          id="profile-avatar-url"
          type="url"
          placeholder="https://…"
          {...register('avatarUrl')}
        />
      </FormField>

      <FormField label="Bio" htmlFor="profile-bio" error={errors.bio?.message}>
        <Textarea id="profile-bio" rows={3} {...register('bio')} />
      </FormField>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || !isDirty} className="w-fit">
        {isSubmitting ? <Spinner size="sm" /> : null}
        Guardar cambios
      </Button>
    </form>
  );
}

export { ProfileForm };
