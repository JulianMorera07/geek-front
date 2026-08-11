/**
 * `PushManager.subscribe()` exige la VAPID public key como `Uint8Array`, pero
 * el backend la manda codificada en base64url (texto) — conversión estándar,
 * sin librería (la usan todos los tutoriales de Web Push por el mismo motivo).
 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  // `new Uint8Array(length)` tipa a `Uint8Array<ArrayBufferLike>` (podría ser
  // `SharedArrayBuffer`) en TS reciente — `PushSubscriptionOptionsInit.applicationServerKey`
  // exige `ArrayBufferView<ArrayBuffer>` puntual, de ahí el `ArrayBuffer` explícito.
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/** Soporte real del navegador para Web Push — falta en Safari &lt; 16, navegadores in-app (Instagram/TikTok), etc. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}
