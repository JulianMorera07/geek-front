/**
 * Genera un hue determinístico (0-360) a partir de un string.
 * Usado para los covers placeholder mientras no hay CDN/API de imágenes real.
 */
export function seedToHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

/** Gradiente CSS determinístico para un cover placeholder (2 tonos análogos). */
export function seedToGradient(seed: string): string {
  const hue = seedToHue(seed);
  const hue2 = (hue + 35) % 360;
  return `linear-gradient(160deg, oklch(0.32 0.09 ${hue}) 0%, oklch(0.18 0.06 ${hue2}) 100%)`;
}
