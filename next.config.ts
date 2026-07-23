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

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://geek-back:8000/api/:path*',
      },
    ]
  },
}
module.exports = nextConfig
