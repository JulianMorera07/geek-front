'use client';

import * as React from 'react';
import Link from 'next/link';
import { MenuIcon, SearchIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Container } from '@/components/layout/container';
import { ThemeToggle } from '@/components/base/theme-toggle';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarProps {
  logo: React.ReactNode;
  /** Enlaces de navegación principal (layout marketing). Omitir en el shell de app con sidebar. */
  links?: NavLink[];
  /** Acciones a la derecha (ej. avatar, notificaciones). El toggle de tema y buscador ya están incluidos. */
  actions?: React.ReactNode;
  /** Abre la paleta de búsqueda (SearchCommand). Si se omite, no se muestra el botón de búsqueda. */
  onSearchClick?: () => void;
  /** Slot a la izquierda antes del logo — típicamente `SidebarTrigger` en el shell de app. */
  leadingSlot?: React.ReactNode;
  className?: string;
}

/**
 * Barra de navegación superior, reutilizable tanto para el layout marketing
 * (con `links`) como para el shell de app (con `leadingSlot` = SidebarTrigger).
 * En mobile, los `links` se muestran en un Sheet lateral.
 */
function Navbar({ logo, links = [], actions, onSearchClick, leadingSlot, className }: NavbarProps) {
  return (
    <header
      className={cn(
        'border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm',
        className,
      )}
    >
      <Container className="flex h-14 items-center gap-2 sm:gap-3">
        {leadingSlot}
        <Link href="/" className="font-heading flex items-center gap-2 font-semibold">
          {logo}
        </Link>

        {links.length > 0 ? (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" render={<Link href={link.href} />}>
                {link.label}
              </Button>
            ))}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          {onSearchClick ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-muted-foreground hidden sm:flex"
              onClick={onSearchClick}
            >
              <SearchIcon />
              Buscar
              <kbd className="border-border bg-muted ml-2 rounded border px-1.5 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </Button>
          ) : null}
          {onSearchClick ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Buscar"
              onClick={onSearchClick}
            >
              <SearchIcon />
            </Button>
          ) : null}

          <ThemeToggle />
          {actions}

          {links.length > 0 ? (
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Abrir menú"
                    className="md:hidden"
                  />
                }
              >
                <MenuIcon />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">{logo}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                  {links.map((link) => (
                    <Button
                      key={link.href}
                      variant="ghost"
                      className="justify-start"
                      render={<Link href={link.href} />}
                    >
                      {link.label}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </Container>
    </header>
  );
}

export { Navbar };
