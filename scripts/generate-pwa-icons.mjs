// Genera los PNG de íconos de la PWA (favicon/apple-icon/manifest) a partir
// de un único SVG fuente — evita mantener varios archivos de imagen a mano.
// Uso: node scripts/generate-pwa-icons.mjs (una sola vez, o cuando cambie el ícono).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const BRAND = '#7c3aed';
const BRAND_DARK = '#5b21b6';

/**
 * Llama estilizada sobre fondo degradado de marca. El trazo de la llama se
 * mantiene dentro del ~65% central del canvas — deja margen de sobra para el
 * "safe zone" que exigen los íconos maskable de Android (recortan hasta un
 * círculo inscrito, ~80% del canvas).
 */
function iconSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${BRAND}" />
      <stop offset="1" stop-color="${BRAND_DARK}" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />
  <path
    fill="#ffffff"
    d="M256 96c18 46-10 70-30 92-22 24-38 46-38 82 0 52 42 94 94 94s94-42 94-94c0-30-12-52-28-70 4 24-4 44-20 44-14 0-22-10-22-24 0-34-20-56-50-88-6 30 2 48-16 66-10 10-22 6-22-8 0-40 20-64 38-94z"
  />
</svg>`;
}

async function main() {
  const iconsDir = path.join(root, 'public', 'icons');
  await mkdir(iconsDir, { recursive: true });

  const targets = [
    { file: path.join(root, 'src', 'app', 'icon.png'), size: 512 },
    { file: path.join(root, 'src', 'app', 'apple-icon.png'), size: 180 },
    { file: path.join(iconsDir, 'icon-192.png'), size: 192 },
    { file: path.join(iconsDir, 'icon-512.png'), size: 512 },
    // Maskable: mismo diseño (ya respeta el safe zone), el manifest lo marca aparte con purpose "maskable".
    { file: path.join(iconsDir, 'icon-maskable-512.png'), size: 512 },
  ];

  for (const { file, size } of targets) {
    const svg = Buffer.from(iconSvg(size));
    await sharp(svg).resize(size, size).png().toFile(file);
  }

  console.log('Íconos generados:', targets.map((t) => path.relative(root, t.file)).join(', '));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
