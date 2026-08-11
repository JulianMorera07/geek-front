import { httpRequest, resolveApiBaseUrl } from '@/lib/http';
import { isNotFoundError } from '@/lib/api-error';

const API_BASE_URL = resolveApiBaseUrl();

interface RawPublicKeyResponse {
  public_key: string;
}

/**
 * GET /push/public-key — la clave VAPID que necesita `PushManager.subscribe()`.
 * `null` si el backend responde 404 (keys todavía no configuradas en prod,
 * según lo acordado) — quien llame debe ocultar la opción de notificaciones
 * en ese caso, no mostrar un error.
 */
export async function fetchPushPublicKey(): Promise<string | null> {
  try {
    const raw = await httpRequest<RawPublicKeyResponse>(`${API_BASE_URL}/push/public-key`);
    return raw.public_key;
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

/**
 * POST /push/subscribe — el body es tal cual lo que devuelve
 * `PushSubscription.toJSON()` del navegador (`endpoint` + `keys.p256dh`/`auth`).
 * `accessToken` opcional: si hay sesión, liga la suscripción al usuario (para
 * poder avisarle de SU anime en emisión); sin sesión, sigue funcionando como
 * suscripción anónima del dispositivo.
 */
export async function subscribeToPush(
  subscription: PushSubscriptionJSON,
  accessToken?: string,
): Promise<void> {
  await httpRequest<void>(`${API_BASE_URL}/push/subscribe`, {
    method: 'POST',
    accessToken,
    body: subscription,
  });
}

/** POST /push/unsubscribe — identifica la suscripción a dar de baja por su `endpoint`. */
export async function unsubscribeFromPush(endpoint: string, accessToken?: string): Promise<void> {
  await httpRequest<void>(`${API_BASE_URL}/push/unsubscribe`, {
    method: 'POST',
    accessToken,
    body: { endpoint },
  });
}
