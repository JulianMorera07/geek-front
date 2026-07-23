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
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
