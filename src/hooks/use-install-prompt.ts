'use client';

import * as React from 'react';

/** Evento no estándar (solo Chromium) — no existe en los tipos de lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallAvailability = 'checking' | 'installable' | 'ios' | 'unavailable';

/**
 * Detecta si se puede ofrecer instalar la PWA y expone `promptInstall()`
 * para disparar el diálogo nativo del navegador (solo Chromium/Android —
 * `beforeinstallprompt` no existe en Safari/iOS, ahí no hay forma
 * programática de instalar, Apple solo permite el flujo manual de
 * "Compartir → Agregar a inicio").
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

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

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
    // descartó antes) — sin ese evento, en iOS igual se pueden mostrar
    // instrucciones manuales; en cualquier otro caso, no hay nada que ofrecer.
    const fallbackTimer = setTimeout(() => {
      setAvailability((current) => (current === 'checking' ? (isIos ? 'ios' : 'unavailable') : current));
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
