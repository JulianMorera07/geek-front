// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   output: 'standalone',
//   images: {
//     // Las imágenes vienen de proveedores externos agregados por el backend
//     // (Jikan/MAL y otros) — hosts variados y no controlados por nosotros,
//     // por eso se permite cualquier host https en vez de un allowlist fijo.
//     remotePatterns: [{ protocol: 'https', hostname: '**' }],
//   },
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Temporal: para poder leer el stack trace real (archivo/línea, no código
  // minificado) del bug de navegación cliente que tumba el Home al volver
  // desde el reproductor. Quitar una vez diagnosticado — expone el código
  // fuente en DevTools de cualquiera que abra el sitio.
  productionBrowserSourceMaps: true,

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    // El optimizador de Next (`/_next/image`) usa `sharp`/`libvips`, cuyo
    // binario precompilado asume instrucciones AVX. El host de producción
    // corre en hardware real sin AVX (confirmado con `lscpu` — un Pentium
    // Dual-Core de 2010) y cualquier imagen que pasara por el optimizador
    // mataba el proceso entero de Node con SIGILL (`trap invalid opcode ...
    // libvips-cpp.so`), tumbando el sitio completo, no solo esa imagen.
    // Las imágenes ya vienen de providers externos que no controlamos, así
    // que no hay pérdida real de optimización propia al desactivarlo.
    unoptimized: true,
  },

  // El proxy hacia el backend interno para `/api/v1/*` ya NO vive acá como
  // rewrite estático — ver `src/app/api/v1/[...path]/route.ts` para el porqué
  // (un rewrite queda congelado en `routes-manifest.json` durante `next
  // build` y no puede configurarse en runtime como se pretendía).
}
module.exports = nextConfig
