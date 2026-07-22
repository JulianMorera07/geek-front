'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClapperboardIcon, FlameIcon, HomeIcon, TrendingUpIcon } from 'lucide-react';

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
import { useGenresQuery } from '@/features/anime/api/queries';
import { UserMenu } from '@/features/auth/components/user-menu';

const primaryNav = [
  { title: 'Inicio', url: '/', icon: HomeIcon },
  { title: 'Últimos', url: '/latest', icon: ClapperboardIcon },
  { title: 'Populares', url: '/popular', icon: TrendingUpIcon },
];

/**
 * Shell único de todo el sitio (sin distinción marketing/app todavía —
 * no hay autenticación en este sprint). Monta Navbar + AppSidebar + Footer.
 */
function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  useCommandShortcut(() => setCommandOpen(true));
  const genresQuery = useGenresQuery();
  const genres = genresQuery.data ?? [];

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
            items: primaryNav.map((item) => ({
              ...item,
              isActive: pathname === item.url,
            })),
          },
          {
            label: 'Géneros',
            items: genres.map((genre) => ({
              title: genre.name,
              url: `/genre/${genre.id}`,
              isActive: pathname === `/genre/${genre.id}`,
            })),
          },
        ]}
      />
      <SidebarInset>
        <Navbar
          logo={
            <span className="flex items-center gap-2">
              <FlameIcon className="text-brand size-5" />
              GeekBaku
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
                { label: 'Últimos', href: '/latest' },
                { label: 'Populares', href: '/popular' },
                { label: 'Buscar', href: '/search' },
              ],
            },
            {
              title: 'Géneros',
              links: genres
                .slice(0, 5)
                .map((genre) => ({ label: genre.name, href: `/genre/${genre.id}` })),
            },
          ]}
        />
      </SidebarInset>

      <AnimeSearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}

export { SiteShell };
