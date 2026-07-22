import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/container';

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  logo: React.ReactNode;
  description?: string;
  columns?: FooterColumn[];
  /** Texto de copyright. Por defecto usa el año actual. */
  copyright?: string;
  className?: string;
}

/** Footer del layout marketing. Reutilizable: columnas y contenido son props, no hardcode. */
function Footer({ logo, description, columns = [], copyright, className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('border-border/60 bg-background border-t', className)}>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(auto-fit,minmax(120px,1fr))]">
        <div className="flex flex-col gap-3">
          <div className="font-heading flex items-center gap-2 font-semibold">{logo}</div>
          {description ? (
            <p className="text-muted-foreground max-w-xs text-sm">{description}</p>
          ) : null}
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-medium">{column.title}</h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>{copyright ?? `© ${year} GeekBaku. Todos los derechos reservados.`}</p>
      </Container>
    </footer>
  );
}

export { Footer };
