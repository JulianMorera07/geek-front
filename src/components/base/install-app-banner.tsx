'use client';

import * as React from 'react';
import { DownloadIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/base/typography';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

const DISMISS_KEY = 'geekbaku:install-banner-dismissed';

/**
 * Banner de "Descarga la aplicación" en la Home. En Android/Chrome/Edge, el
 * botón dispara el diálogo nativo de instalación (`beforeinstallprompt`); en
 * iOS, que no permite disparar la instalación por código, muestra
 * instrucciones manuales. Se oculta solo si ya está instalada o el
 * navegador no soporta ninguna de las dos vías.
 */
function InstallAppBanner() {
  const { availability, promptInstall } = useInstallPrompt();
  // Arranca oculto (igual en servidor y en el primer render de hidratación)
  // y se sincroniza con `localStorage` en un efecto — mismo motivo que el
  // resto de banners de esta app: evita el mismatch de hidratación (#418).
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  if (dismissed || availability === 'checking' || availability === 'unavailable') return null;

  return (
    <div className="bg-muted/40 flex items-center gap-4 rounded-xl border p-4">
      <div className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
        <DownloadIcon className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text className="font-medium">Descarga la aplicación</Text>
        <Text variant="muted">
          {availability === 'ios'
            ? 'Toca el botón de compartir de Safari y luego "Agregar a inicio".'
            : 'Instálala en tu pantalla de inicio para acceder más rápido.'}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {availability === 'installable' ? (
          <Button size="sm" onClick={promptInstall}>
            <DownloadIcon />
            Descargar
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={handleDismiss} aria-label="Cerrar aviso">
          <XIcon />
        </Button>
      </div>
    </div>
  );
}

export { InstallAppBanner };
