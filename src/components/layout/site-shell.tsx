'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClapperboardIcon, CompassIcon, FlameIcon, HeartIcon, HomeIcon, TrendingUpIcon } from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import {
  AppSidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/layout/app-sidebar';
import { Footer } from '@/components/layout/footer';
import {
  AnimeSearchCommand,
  useCommandShortcut,
} from '@/features/anime/components/anime-search-command';
import { useOngoingCatalogQuery } from '@/features/anime/api/queries';
import { UserMenu } from '@/features/auth/components/user-menu';
import { useAuth } from '@/features/auth/use-auth';

const primaryNav = [
  { title: 'Inicio', url: '/', icon: HomeIcon },
  { title: 'Explorar', url: '/directory', icon: CompassIcon },
  { title: 'Últimos', url: '/latest', icon: ClapperboardIcon },
  { title: 'Populares', url: '/popular', icon: TrendingUpIcon },
];

/**
 * Shell único de todo el sitio (sin distinción marketing/app todavía —
 * no hay autenticación en este sprint). Monta Navbar + AppSidebar + Footer.
 *
 * Sin filtro de género: enlazaba a `/genre/[id]` (catálogo interno), que
 * hoy está vacío/sin seed — filtrar por género ahí no encontraba la mayoría
 * de los animes reales (esos viven en el Provider Framework, sin género
 * propio). Se quita hasta tener una fuente de géneros que sí cubra el
 * contenido real (decisión confirmada con el usuario, 2026-07-30).
 */
function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  useCommandShortcut(() => setCommandOpen(true));

  const { isAuthenticated } = useAuth();
  const ongoingQuery = useOngoingCatalogQuery();
  const ongoingAnimes = ongoingQuery.data?.items ?? [];

  const navItems = isAuthenticated
    ? [...primaryNav, { title: 'Favoritos', url: '/favorites', icon: HeartIcon }]
    : primaryNav;

  return (
    <SidebarProvider>
      <AppSidebar
        header={
          <Link href="/" className="font-heading flex items-center gap-2 px-2 py-1.5 font-semibold">
            <FlameIcon className="text-brand size-5" />
            GeekBaku
          </Link>
        }
        groups={[
          {
            label: 'Navegación',
            items: navItems.map((item) => ({
              ...item,
              isActive: pathname === item.url,
            })),
          },
          ...(ongoingAnimes.length > 0
            ? [
                {
                  label: 'En emisión',
                  items: ongoingAnimes.map((anime) => ({
                    title: anime.title,
                    url: `/anime/${anime.id}`,
                    isActive: pathname === `/anime/${anime.id}`,
                  })),
                },
              ]
            : []),
        ]}
      />
      <SidebarInset>
        <Navbar
          logo={
            <span className="flex items-center gap-2">
              <FlameIcon className="text-brand size-5" />
              {/* Oculto en mobile: el Navbar ya tiene sidebar trigger + buscar +
                  tema + login/registro en la misma fila sin wrap — sumado al
                  wordmark completo, desborda el ancho de un celular normal
                  (confirmado en vivo: empujaba el botón "Registrarse" fuera de
                  la pantalla). El wordmark completo sigue en el sidebar. */}
              <span className="hidden sm:inline">GeekBaku</span>
            </span>
          }
          leadingSlot={<SidebarTrigger />}
          onSearchClick={() => setCommandOpen(true)}
          actions={<UserMenu />}
        />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer
          logo={
            <span className="flex items-center gap-2">
              <FlameIcon className="text-brand size-5" />
              GeekBaku
            </span>
          }
          description="Catálogo de anime conectado a la API real de GeekBaku."
          columns={[
            {
              title: 'Explorar',
              links: [
                { label: 'Directorio', href: '/directory' },
                { label: 'Últimos', href: '/latest' },
                { label: 'Populares', href: '/popular' },
                { label: 'Buscar', href: '/search' },
              ],
            },
          ]}
        />
      </SidebarInset>

      <AnimeSearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}

export { SiteShell };
