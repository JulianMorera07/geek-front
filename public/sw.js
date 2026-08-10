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
