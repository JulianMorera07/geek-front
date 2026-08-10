'use client';

import * as React from 'react';

/**
 * Registra el service worker (`public/sw.js`) después del montaje — no
 * bloquea el render ni el hydration. Sin JSX (`return null`): es un efecto
 * puro, montado una sola vez en el layout raíz.
 */
function PwaRegister() {
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('[PwaRegister] No se pudo registrar el service worker:', error);
    });
  }, []);

  return null;
}

export { PwaRegister };
