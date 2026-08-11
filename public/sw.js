// Service worker mínimo — su único trabajo real es habilitar el prompt de
// "Instalar app" (Chrome/Android lo exige como criterio de instalabilidad).
// Deliberadamente NO cachea el catálogo/reproductor: es contenido dinámico
// conectado a la API real, cachearlo agresivo mostraría datos viejos
// (animes/episodios que ya cambiaron). Solo cachea el puñado de assets
// realmente estáticos, y sirve una página simple de "sin conexión" cuando
// falla una navegación sin red.
const CACHE_NAME = 'geekbaku-shell-v1';
const PRECACHE_URLS = ['/icons/icon-192.png', '/icons/icon-512.png', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Solo navegaciones de página completa (no XHR/fetch a la API, no
  // imágenes) — únicamente ahí tiene sentido un fallback offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
  }
});

// Muestra la notificación push que mande el backend (ej. "salió el capítulo
// nuevo de X"). El payload es JSON con `title`/`body`/`url` — si no viene
// como JSON válido, se usa un texto genérico en vez de fallar silenciosamente
// (una notificación push sin `event.waitUntil(showNotification)` no se
// muestra y el navegador puede desactivar el permiso por "silenciosa").
self.addEventListener('push', (event) => {
  let payload = { title: 'GeekBaku', body: 'Tienes una notificación nueva.', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // payload no era JSON — se usa el genérico de arriba.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url },
    }),
  );
});

// Al hacer click en la notificación, enfoca una pestaña ya abierta del sitio
// si existe, o abre una nueva en la URL del payload (ej. la ficha del anime).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
