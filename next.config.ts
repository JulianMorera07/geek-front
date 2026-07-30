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

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  // El proxy hacia el backend interno para `/api/v1/*` ya NO vive acá como
  // rewrite estático — ver `src/app/api/v1/[...path]/route.ts` para el porqué
  // (un rewrite queda congelado en `routes-manifest.json` durante `next
  // build` y no puede configurarse en runtime como se pretendía).
}
module.exports = nextConfig
