import { AuthGuard } from '@/features/auth/components/auth-guard';

/** Agrupa las rutas que requieren sesión (`/profile`, `/settings`) sin afectar la URL. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
