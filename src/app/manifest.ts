import type { MetadataRoute } from 'next';

/**
 * Convención de archivo de Next.js: genera `/manifest.webmanifest`
 * automáticamente, con el content-type correcto. Habilita "Agregar a
 * pantalla de inicio" en Android/iOS — ícono propio, pantalla completa (sin
 * la barra de direcciones del navegador), y color de marca en la barra de
 * estado/splash screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GeekBaku',
    short_name: 'GeekBaku',
    description: 'Catálogo de anime conectado.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#7c3aed',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
