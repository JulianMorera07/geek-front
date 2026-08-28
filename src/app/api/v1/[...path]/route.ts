import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy same-origin hacia el backend interno para todo `/api/v1/*`.
 *
 * Reemplaza el antiguo rewrite estático de `next.config.ts`: ese rewrite se
 * resuelve una sola vez durante `next build` y queda congelado en
 * `.next/routes-manifest.json` (confirmado inspeccionando el manifest en el
 * contenedor) — cambiar `BACKEND_INTERNAL_HOST` con `docker run -e` en
 * runtime no tenía ningún efecto, seguía pegándole al host de build (o al
 * default `geek-back:8001`, inexistente si la red real usa otro nombre de
 * servicio), y todas las requests del navegador (que siempre van a la ruta
 * relativa `/api/v1`, ver `resolveApiBaseUrl` en `src/lib/http.ts`) fallaban
 * con `ENOTFOUND`/timeout aunque el backend respondiera bien.
 *
 * Un Route Handler, a diferencia de `rewrites()`, sí re-ejecuta su código
 * (incluyendo `process.env`) en cada request — mismo patrón que
 * `src/app/api/media-proxy/route.ts` — así que el host destino queda
 * realmente configurable en runtime sin rebuild, como siempre se documentó
 * que debía funcionar.
 */
export const dynamic = 'force-dynamic';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const backendHost = process.env.BACKEND_INTERNAL_HOST ?? 'geek-back:8001';
  const upstreamUrl = `http://${backendHost}/api/v1/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (accept) headers.set('accept', accept);
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: METHODS_WITH_BODY.has(request.method) ? await request.text() : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor.' } },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const responseContentType = upstream.headers.get('content-type');
  if (responseContentType) responseHeaders.set('content-type', responseContentType);

  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
