import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

/**
 * SSR-safe: `useSyncExternalStore` garantiza que la hidratación (server +
 * primer render de cliente) siempre coincidan en `false`; el valor real del
 * viewport se aplica recién después de hidratar. Un `useState` + efecto que
 * lee `window.innerWidth` directo en el render del cliente causa un mismatch
 * de hidratación cuando el viewport real es angosto.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
