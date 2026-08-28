import { NextResponse } from 'next/server';

/**
 * Proxy hacia el `.apk` del TWA de Android, publicado como asset fijo del
 * release `android-latest` en GitHub (ver `.github/workflows/build-android-twa.yml`
 * y `docs`/conversación del 2026-08-28). Sirve el binario desde el propio
 * dominio (`geekbaku.valhalla.monster/download/geekbaku.apk`) en vez de
 * mandar a la gente a una URL de github.com — mejor para pegar en Downloader
 * (Google TV) y no depende de que el repo sea público.
 *
 * El repo es privado, así que hace falta autenticarse contra la API de
 * GitHub con un token (`GITHUB_RELEASE_TOKEN`, permiso de solo lectura sobre
 * "Contents" de este repo — un fine-grained PAT alcanza). Nunca se expone al
 * cliente: todo el fetch pasa por acá, server-side.
 */
const GITHUB_REPO = 'JulianMorera07/geek-front';
const RELEASE_TAG = 'android-latest';
const ASSET_NAME = 'app-release-signed.apk';

export async function GET() {
  const token = process.env.GITHUB_RELEASE_TOKEN;
  if (!token) {
    console.error('[download/geekbaku.apk] Falta GITHUB_RELEASE_TOKEN en el entorno del servidor.');
    return NextResponse.json(
      { error: { code: 'MISCONFIGURED', message: 'La descarga no está configurada todavía.' } },
      { status: 500 },
    );
  }

  const releaseRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      // Nunca cachear la metadata del release — cada build nueva reemplaza el
      // asset, y queremos que el próximo request vea el más reciente.
      cache: 'no-store',
    },
  );

  if (releaseRes.status === 404) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_BUILT_YET',
          message: 'Todavía no se generó ningún APK — corre el workflow de GitHub Actions primero.',
        },
      },
      { status: 404 },
    );
  }
  if (!releaseRes.ok) {
    console.error(`[download/geekbaku.apk] GitHub API respondió ${releaseRes.status}`);
    return NextResponse.json(
      { error: { code: 'UPSTREAM_ERROR', message: 'No se pudo consultar el release en GitHub.' } },
      { status: 502 },
    );
  }

  const release = (await releaseRes.json()) as {
    assets: { name: string; url: string }[];
  };
  const asset = release.assets.find((a) => a.name === ASSET_NAME);
  if (!asset) {
    return NextResponse.json(
      { error: { code: 'ASSET_NOT_FOUND', message: `El release no tiene un asset "${ASSET_NAME}".` } },
      { status: 404 },
    );
  }

  // El asset en sí se pide vía la URL de la API (no `browser_download_url`,
  // que redirige a un storage temporal sin aceptar el header de auth) con
  // `Accept: application/octet-stream` — así GitHub devuelve el binario
  // directo en vez del JSON de metadata.
  const assetRes = await fetch(asset.url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' },
    cache: 'no-store',
  });

  if (!assetRes.ok || !assetRes.body) {
    console.error(`[download/geekbaku.apk] Descarga del asset falló: ${assetRes.status}`);
    return NextResponse.json(
      { error: { code: 'DOWNLOAD_FAILED', message: 'No se pudo descargar el APK desde GitHub.' } },
      { status: 502 },
    );
  }

  return new NextResponse(assetRes.body, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="geekbaku.apk"',
      ...(assetRes.headers.get('content-length')
        ? { 'Content-Length': assetRes.headers.get('content-length')! }
        : {}),
    },
  });
}
