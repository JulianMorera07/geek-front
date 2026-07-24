import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy same-origin hacia medios propios del backend (thumbnails/avatares
 * subidos ahí, no de un provider externo). Existe porque esas URLs vienen del
 * backend apuntando a su hostname en la network interna de Docker/Podman
 * (ej. `geek-back:8000`), que el navegador nunca puede resolver — ver
 * `resolveMediaUrl` en `src/lib/http.ts`, que arma el `?u=` que llega acá.
 *
 * `u` es siempre un path (nunca una URL absoluta) para no habilitar un open
 * proxy/SSRF: el host de destino sale únicamente de `BACKEND_INTERNAL_HOST`,
 * fijado por el servidor, jamás del request.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('u');

  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return NextResponse.json({ error: { code: 'INVALID_PATH', message: 'Path inválido.' } }, { status: 400 });
  }

  const backendHost = process.env.BACKEND_INTERNAL_HOST ?? 'geek-back:8000';
  const upstreamUrl = `http://${backendHost}${path}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { cache: 'no-store' });
  } catch {
    return NextResponse.json(
      { error: { code: 'NETWORK_ERROR', message: 'No se pudo conectar con el backend interno.' } },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: { code: 'UPSTREAM_ERROR', message: `El backend respondió ${upstream.status}.` } },
      { status: upstream.status || 502 },
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  const contentLength = upstream.headers.get('content-length');
  if (contentType) headers.set('content-type', contentType);
  if (contentLength) headers.set('content-length', contentLength);
  headers.set('cache-control', 'public, max-age=3600');

  return new NextResponse(upstream.body, { status: 200, headers });
}
