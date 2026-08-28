import { ApiError } from '@/lib/api-error';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Siempre relativa, tanto en el navegador como en el servidor (RSC) — ambos
 * pasan por el mismo Route Handler (`src/app/api/v1/[...path]/route.ts`),
 * que es la única fuente de verdad de a qué host interno (`BACKEND_INTERNAL_HOST`)
 * pegarle. Antes el servidor tenía un segundo camino directo al backend vía
 * `BACKEND_INTERNAL_URL` (otra variable, otro formato) — dos rutas para lo
 * mismo que podían desincronizarse y hacer que una parte del sitio funcionara
 * y otra no sin motivo aparente. Un único camino es más simple de depurar
 * (el tráfico completo pasa por el mismo lugar) y no cuesta nada perceptible:
 * es un hop extra por loopback (`localhost:3000`), no una red externa.
 */
export function resolveApiBaseUrl(): string {
  return '/api/v1';
}

/**
 * Algunas respuestas del backend traen URLs absolutas de medios propios
 * (thumbnails/avatares subidos al backend, no de un provider externo como
 * Jikan) apuntando al hostname interno de Docker/Podman (ej.
 * `http://geek-back:8001/media/x.jpg`) — el navegador nunca puede resolver
 * ese host. Los providers externos documentados siempre son `https`, así que
 * cualquier URL `http://` se asume interna y se reescribe para pasar por el
 * proxy same-origin `/api/media-proxy`, que sí vive en la network interna.
 * URLs `https://` (o relativas) se devuelven tal cual.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!/^http:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    return `/api/media-proxy?u=${encodeURIComponent(parsed.pathname + parsed.search)}`;
  } catch {
    return url;
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  timeoutMs?: number;
}

/**
 * Fetch central con timeout (`AbortController`) y parseo de error tolerante
 * a las **dos** formas reales que devuelve el backend:
 * - Errores de dominio (`exception_handlers.py`): `{"error": {"code","message"}}`.
 * - Errores de FastAPI/Starlette antes de llegar al handler (ej. `HTTPBearer`
 *   auto_error cuando falta o es inválido el header `Authorization`):
 *   `{"detail": "Not authenticated"}`.
 *
 * Nunca deja pasar un error sin normalizar — todo termina en `ApiError`.
 */
export async function httpRequest<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[httpRequest] timeout tras ${timeoutMs}ms → ${url}`);
      throw new ApiError('El servidor tardó demasiado en responder.', {
        status: 408,
        code: 'TIMEOUT',
      });
    }
    console.error(`[httpRequest] error de red → ${url}`, error);
    throw new ApiError('No se pudo conectar con el servidor.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const parsed = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const { code, message } = extractError(parsed, response.status);
    console.error(`[httpRequest] ${response.status} ${code} → ${url}`, message);
    throw new ApiError(message, { status: response.status, code });
  }

  return parsed as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractError(parsed: unknown, status: number): { code: string; message: string } {
  if (parsed && typeof parsed === 'object') {
    const body = parsed as {
      error?: { code?: string; message?: string };
      detail?: string | { msg?: string }[];
    };
    if (body.error) {
      return {
        code: body.error.code ?? 'UNKNOWN_ERROR',
        message: body.error.message ?? `Error ${status} al consultar la API.`,
      };
    }
    if (typeof body.detail === 'string') {
      // Shape nativo de FastAPI/Starlette (ej. HTTPBearer auto_error) — no
      // pasa por `exception_handlers.py`. 401/403 acá siempre significan
      // "no autenticado" (header ausente/mal formado o token inválido).
      return { code: 'not_authenticated', message: body.detail };
    }
    if (Array.isArray(body.detail)) {
      // Error 422 de validación de Pydantic (lista de errores por campo).
      const first = body.detail[0]?.msg;
      return { code: 'validation_error', message: first ?? 'Datos inválidos.' };
    }
  }
  return { code: 'UNKNOWN_ERROR', message: `Error ${status} al consultar la API.` };
}
