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
    // Host:puerto del backend en la network interna de Docker. Se lee en
    // runtime (el `runner` stage del Dockerfile no fija `BACKEND_INTERNAL_URL`,
    // así que esto puede setearse con `-e` sin rebuildear la imagen si el
    // nombre del servicio en el compose real difiere de `geek-back`).
    const backendHost = process.env.BACKEND_INTERNAL_HOST ?? 'geek-back:8000';
    return [
      {
        source: '/api/:path*',
        destination: `http://${backendHost}/api/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
