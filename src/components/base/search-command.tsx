'use client';

import * as React from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

export interface SearchCommandItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface SearchCommandGroup {
  heading: string;
  items: SearchCommandItem[];
}

export interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SearchCommandGroup[];
  placeholder?: string;
  emptyLabel?: string;
  /**
   * Controlado: para cuando `groups` viene de una búsqueda real contra el
   * backend (con debounce) en vez de una lista estática — en ese caso el
   * filtrado difuso local de `cmdk` sobra (y de hecho rompe la búsqueda:
   * solo "encuentra" lo que ya estaba precargado). Pasar junto con
   * `shouldFilter={false}`.
   */
  value?: string;
  onValueChange?: (value: string) => void;
  shouldFilter?: boolean;
}

/**
 * Paleta de búsqueda/comandos global (estilo Cmd+K), montada una sola vez
 * (típicamente en el shell de la app) y controlada por estado de UI
 * (ver `useCommandShortcut` y el store de UI en `stores/`).
 *
 * Los `groups` son estáticos/locales (navegación, acciones) o resultados de
 * búsqueda ya resueltos por la feature — este componente no hace fetch.
 */
function SearchCommand({
  open,
  onOpenChange,
  groups,
  placeholder = 'Buscar o ejecutar un comando…',
  emptyLabel = 'Sin resultados.',
  value,
  onValueChange,
  shouldFilter,
}: SearchCommandProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={shouldFilter}>
      <CommandInput placeholder={placeholder} value={value} onValueChange={onValueChange} />
      <CommandList>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
        {groups.map((group, index) => (
          <React.Fragment key={group.heading}>
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                  {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {index < groups.length - 1 ? <CommandSeparator /> : null}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Escucha el atajo ⌘K / Ctrl+K y ejecuta `onTrigger`. Úsalo junto a un estado
 * `open` (local o de un store de UI) que controle `SearchCommand`.
 */
function useCommandShortcut(onTrigger: () => void) {
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onTrigger();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger]);
}

export { SearchCommand, useCommandShortcut };
