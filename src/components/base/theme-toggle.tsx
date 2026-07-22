'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Hydration-safe "mounted" flag: server siempre `false`, cliente `true` tras montar. */
function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Alterna entre tema claro/oscuro. La app es dark-first: `defaultTheme="dark"`
 * se define en `ThemeProvider` (src/components/theme-provider.tsx).
 */
function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Cambiar tema"
      disabled={!mounted}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

export { ThemeToggle };
