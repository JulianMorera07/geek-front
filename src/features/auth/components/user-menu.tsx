'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/use-auth';

/** Menú de usuario del Navbar: avatar + link a perfil/config/logout, o botones de login/registro si no hay sesión. */
function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" render={<Link href="/login" />}>
          <span className="hidden sm:inline">Iniciar sesión</span>
          <span className="sm:hidden">Entrar</span>
        </Button>
        <Button size="sm" render={<Link href="/register" />}>
          <span className="hidden sm:inline">Registrarse</span>
          <span className="sm:hidden">Registro</span>
        </Button>
      </div>
    );
  }

  const initials = (user.profile.displayName || user.username).slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    toast.success('Sesión cerrada');
    router.push('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menú de usuario"
            className="rounded-full"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarImage src={user.profile.avatarUrl ?? undefined} alt={user.username} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.profile.displayName || user.username}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <UserIcon />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon />
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
