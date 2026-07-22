'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Cantidad de páginas visibles alrededor de la actual (sin contar primera/última). */
  siblingCount?: number;
}

function getPageRange(
  page: number,
  pageCount: number,
  siblingCount: number,
): (number | 'ellipsis')[] {
  const totalVisible = siblingCount * 2 + 5;
  if (pageCount <= totalVisible) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, pageCount - 1);

  const range: (number | 'ellipsis')[] = [1];
  if (left > 2) range.push('ellipsis');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < pageCount - 1) range.push('ellipsis');
  range.push(pageCount);

  return range;
}

/** Paginación client-side genérica. No sabe de dónde viene la data (mock hoy, API luego). */
function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = getPageRange(page, pageCount, siblingCount);

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
      </Button>

      {pages.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="text-muted-foreground flex size-8 items-center justify-center"
          >
            <MoreHorizontalIcon className="size-4" />
          </span>
        ) : (
          <Button
            key={entry}
            type="button"
            variant={entry === page ? 'default' : 'outline'}
            size="icon-sm"
            aria-current={entry === page ? 'page' : undefined}
            onClick={() => onPageChange(entry)}
          >
            {entry}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Página siguiente"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  );
}

export { Pagination };
