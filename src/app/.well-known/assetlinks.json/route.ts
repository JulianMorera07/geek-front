import { NextResponse } from 'next/server';

/**
 * Digital Asset Links — verifica ante Android que este dominio y el APK TWA
 * (`monster.valhalla.geekbaku.twa`, firmado con la keystore de
 * `.github/workflows/build-android-twa.yml`) son del mismo dueño. Sin esto,
 * la app Android abre el sitio dentro de una vista con barra de direcciones
 * (Custom Tabs normal) en vez de a pantalla completa como una app nativa.
 *
 * El fingerprint SHA-256 sale de:
 *   keytool -list -v -keystore android.keystore -alias android
 *
 * Si algún día se regenera la keystore (nunca debería hacer falta — se
 * reusa siempre la misma, restaurada en CI desde el secret
 * `ANDROID_KEYSTORE_BASE64`), hay que actualizar el fingerprint acá.
 */
export async function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'monster.valhalla.geekbaku.twa',
        sha256_cert_fingerprints: [
          '12:E6:5C:43:26:EB:61:74:14:DD:99:F1:92:AD:EF:75:7E:76:E6:7A:2F:07:38:19:BF:2D:05:B2:5D:DB:03:A8',
        ],
      },
    },
  ]);
}
