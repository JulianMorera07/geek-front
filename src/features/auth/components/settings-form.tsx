'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/base/form-field';
import { Spinner } from '@/components/base/loading';
import { useAuth } from '@/features/auth/use-auth';
import { settingsSchema, type SettingsFormValues } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import type { User } from '@/features/auth/api/types';

const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const themeOptions = [
  { value: 'system', label: 'Según el sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

function SettingsForm({ user }: { user: User }) {
  const { updateSettings } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: (user.settings.language as SettingsFormValues['language']) ?? 'es',
      theme: (user.settings.theme as SettingsFormValues['theme']) ?? 'system',
      notificationsEnabled: user.settings.notificationsEnabled,
    },
  });

  async function onSubmit(values: SettingsFormValues) {
    try {
      await updateSettings(values);
      toast.success('Configuración actualizada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No pudimos guardar tu configuración.';
      setError('root', { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="Idioma" htmlFor="settings-language">
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="settings-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Tema" htmlFor="settings-theme">
        <Controller
          control={control}
          name="theme"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="settings-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="flex items-center justify-between py-1">
        <label htmlFor="settings-notifications" className="text-sm font-medium">
          Notificaciones
        </label>
        <Controller
          control={control}
          name="notificationsEnabled"
          render={({ field }) => (
            <Switch
              id="settings-notifications"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

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

export { SettingsForm };
