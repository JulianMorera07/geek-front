'use client';

import * as React from 'react';
import { ChevronDownIcon, ListFilterIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** `single` renderiza radio items (con una opción "Todos" para limpiar) en vez de checkboxes. Default `multiple`. */
  mode?: 'multiple' | 'single';
}

export interface SortConfig {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  groups: FilterGroup[];
  sort?: SortConfig;
  onClear?: () => void;
  className?: string;
}

/**
 * Barra de filtros genérica y reutilizable (multi-select por grupo + orden).
 * No sabe nada de anime/dominio — `groups`/`sort` traen las opciones y el
 * estado controlado desde quien la usa (ej. `AnimeFilters`).
 */
function FilterBar({ groups, sort, onClear, className }: FilterBarProps) {
  const hasActiveFilters = groups.some((group) => group.value.length > 0);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <ListFilterIcon className="text-muted-foreground size-4 shrink-0" />

      {groups.map((group) => (
        <DropdownMenu key={group.id}>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
            {group.label}
            {group.value.length > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {group.value.length}
              </Badge>
            ) : null}
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {group.mode === 'single' ? (
              <DropdownMenuRadioGroup
                value={group.value[0] ?? ''}
                onValueChange={(next) => group.onChange(next ? [next] : [])}
              >
                <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
                {group.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            ) : (
              group.options.map((option) => {
                const checked = group.value.includes(option.value);
                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={checked}
                    onCheckedChange={(next) => {
                      group.onChange(
                        next
                          ? [...group.value, option.value]
                          : group.value.filter((v) => v !== option.value),
                      );
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {sort ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
            {sort.label ?? 'Ordenar'}: {sort.options.find((o) => o.value === sort.value)?.label}
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={sort.value} onValueChange={sort.onChange}>
              {sort.options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {hasActiveFilters && onClear ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <XIcon />
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}

export { FilterBar };
