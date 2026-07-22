'use client';

import * as React from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export interface SearchInputProps extends Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value'
> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

/**
 * Campo de búsqueda inline (no modal). Para búsqueda global tipo Cmd+K
 * usa `SearchCommand` en su lugar.
 *
 * No dispara llamadas a la API por sí mismo — es solo el control de UI;
 * el debounce/fetch vive en el hook de la feature que lo consume.
 */
function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar…',
  className,
  ...props
}: SearchInputProps) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label="Limpiar búsqueda"
            size="icon-xs"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export { SearchInput };
