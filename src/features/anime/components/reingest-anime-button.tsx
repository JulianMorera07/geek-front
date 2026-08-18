'use client';

import { WrenchIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/features/auth/components/permission-guard';
import { useReingestAnimeAllMutation } from '@/features/anime/api/queries';

export interface ReingestAnimeButtonProps {
  animeId: string;
  className?: string;
}

/**
 * Botón "Reparar" — SOLO admin (`admin:manage`). `fallback={null}` en el
 * `PermissionGuard`: para cualquier otro usuario esto no se monta en el DOM,
 * no hay ni un rastro de que existe — no es solo un botón oculto por CSS. No
 * hay ningún link/nav hacia esto tampoco: vive únicamente acá, en la ficha
 * del anime, a la vista solo de quien ya tiene el permiso.
 *
 * Llama a `POST /anime/:id/reingest/all`: el backend prueba los 3 providers
 * registrados automáticamente (mismo ranking que `/search`) y reemplaza las
 * temporadas con el que sí responda — no hace falta elegir provider a mano.
 */
function ReingestAnimeButton({ animeId, className }: Readonly<ReingestAnimeButtonProps>) {
  const mutation = useReingestAnimeAllMutation();

  function handleClick() {
    mutation.mutate(animeId, {
      onSuccess: () => toast.success('Anime reparado — temporadas actualizadas.'),
      onError: (error) => {
        const message =
          error instanceof Error && error.message ? error.message : 'No se pudo reparar el anime.';
        toast.error(message);
      },
    });
  }

  return (
    <PermissionGuard permission="admin:manage" fallback={null}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={className}
        disabled={mutation.isPending}
        onClick={handleClick}
      >
        <WrenchIcon />
        {mutation.isPending ? 'Reparando…' : 'Reparar (admin)'}
      </Button>
    </PermissionGuard>
  );
}

export { ReingestAnimeButton };
