'use client';

import * as React from 'react';
import { ShieldAlertIcon } from 'lucide-react';

import { EmptyState } from '@/components/base/empty-state';
import { useAuth } from '@/features/auth/use-auth';

export interface PermissionGuardProps {
  children: React.ReactNode;
  /** Permiso requerido (ej. `"catalog:read"`). Si se omite, se evalúa `role`. */
  permission?: string;
  /** Rol requerido (ej. `"admin"`). Se evalúa si no hay `permission`. */
  role?: string;
  /** Qué mostrar si no tiene el permiso/rol. Por defecto, un `EmptyState` inline (no redirige). */
  fallback?: React.ReactNode;
}

/**
 * Oculta `children` (mostrando `fallback` en su lugar) si el usuario
 * autenticado no tiene el permiso/rol requerido. A diferencia de
 * `AuthGuard`, no redirige — es para secciones dentro de una página ya
 * accesible, no para proteger la ruta completa.
 */
// Default por parámetro, no por `??` en el body: `fallback={null}` (pedir
// explícitamente "no muestres nada") es un valor válido y distinto de "no
// pasé la prop". Con `??` en el body, `null ?? <EmptyState/>` cae igual al
// EmptyState por defecto — `null` cuenta como nullish — y `fallback={null}`
// terminaba mostrando el aviso "No tienes permiso" en vez de ocultar todo
// (bug real, visto en vivo con `ReingestAnimeButton` para usuarios sin
// sesión). El default como parámetro solo se aplica cuando la prop es
// `undefined`, nunca cuando es `null` explícito.
function PermissionGuard({
  children,
  permission,
  role,
  fallback = (
    <EmptyState
      icon={<ShieldAlertIcon className="size-6" />}
      title="No tienes permiso para ver esto"
      description="Si crees que es un error, contacta a un administrador."
    />
  ),
}: PermissionGuardProps) {
  const { hasPermission, hasRole } = useAuth();

  const allowed = permission ? hasPermission(permission) : role ? hasRole(role) : true;

  if (allowed) return children;

  return fallback;
}

export { PermissionGuard };
