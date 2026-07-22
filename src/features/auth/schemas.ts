import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu email.').email('Email inválido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Ingresa tu email.').email('Email inválido.'),
    username: z
      .string()
      .min(3, 'Mínimo 3 caracteres.')
      .max(32, 'Máximo 32 caracteres.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo.'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Za-z]/, 'Debe incluir al menos una letra.')
      .regex(/[0-9]/, 'Debe incluir al menos un número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Ingresa tu email.').email('Email inválido.'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const profileSchema = z.object({
  displayName: z.string().max(64, 'Máximo 64 caracteres.').optional(),
  // Se acepta '' (campo vacío) además de una URL válida — se normaliza a
  // `undefined` en el submit del formulario, no acá, para no divergir el
  // tipo de entrada/salida del schema (rompe la inferencia de `zodResolver`).
  avatarUrl: z.union([z.string().url('URL inválida.'), z.literal('')]).optional(),
  bio: z.string().max(280, 'Máximo 280 caracteres.').optional(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const settingsSchema = z.object({
  language: z.enum(['es', 'en']),
  theme: z.enum(['system', 'light', 'dark']),
  notificationsEnabled: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;
