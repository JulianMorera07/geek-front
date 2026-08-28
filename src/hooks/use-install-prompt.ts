'use client';

import * as React from 'react';

/** Evento no estándar (solo Chromium) — no existe en los tipos de lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallAvailability = 'checking' | 'installable' | 'ios' | 'tv' | 'unavailable';

/**
 * Detecta si se puede ofrecer instalar la PWA y expone `promptInstall()`
 * para disparar el diálogo nativo del navegador (solo Chromium/Android —
 * `beforeinstallprompt` no existe en Safari/iOS, ahí no hay forma
 * programática de instalar, Apple solo permite el flujo manual de
 * "Compartir → Agregar a inicio"). Google TV/Android TV corre Chrome pero
 * NO dispara `beforeinstallprompt` (confirmado en vivo — el navegador de TV
 * no cumple los criterios de "engagement" de Chrome para ofrecerlo solo,
 * aunque el manifest/service worker sean válidos) — ahí también hace falta
 * un flujo manual, vía el menú del propio navegador.
 */
export function useInstallPrompt() {
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [availability, setAvailability] = React.useState<InstallAvailability>('checking');

  React.useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setAvailability('unavailable');
      return;
    }

    const userAgent = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(userAgent);
    // Android TV/Google TV/Fire TV — todos corren Chrome/WebView con "TV" o
    // el nombre del dispositivo en el user agent. `AFT*` es el prefijo de
    // los modelos Fire TV Stick.
    const isTv = /android tv|googletv|google tv|smarttv|smart-tv|\baft[a-z0-9]*\b/i.test(userAgent);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setAvailability('installable');
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    function handleAppInstalled() {
      deferredPromptRef.current = null;
      setAvailability('unavailable');
    }
    window.addEventListener('appinstalled', handleAppInstalled);

    // Chrome dispara `beforeinstallprompt` async (o nunca, si ya se
    // descartó antes, o si el navegador no lo soporta de entrada como en TV)
    // — sin ese evento, en iOS/TV igual se pueden mostrar instrucciones
    // manuales; en cualquier otro caso, no hay nada que ofrecer.
    const fallbackTimer = setTimeout(() => {
      setAvailability((current) =>
        current === 'checking' ? (isIos ? 'ios' : isTv ? 'tv' : 'unavailable') : current,
      );
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  async function promptInstall() {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPromptRef.current = null;
    if (choice.outcome === 'accepted') setAvailability('unavailable');
  }

  return { availability, promptInstall };
}
