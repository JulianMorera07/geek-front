import { DownloadIcon, TvIcon } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Heading, Text } from '@/components/base/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const APK_URL = '/download/geekbaku.apk';

/**
 * Página pensada para Google TV/Android TV con navegadores tipo Downloader
 * (que no soportan instalar la PWA como tal, ver conversación del
 * 2026-08-28) — se les pasa esta URL directo, o la del `.apk` de abajo. En
 * celular/desktop la app se instala como PWA normal (banner de la Home), acá
 * es la app Android real (TWA) empaquetada vía Bubblewrap + GitHub Actions.
 */
export default function DescargarPage() {
  return (
    <Container size="narrow" className="flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-1 text-center">
        <Heading level="h1">Descarga GeekBaku</Heading>
        <Text variant="muted">Para instalar en Android TV / Google TV.</Text>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TvIcon className="size-5" />
            Google TV / Android TV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Text variant="muted">
            Abre la app <strong>Downloader</strong> (o cualquier navegador de tu TV) y pega esta
            dirección para bajar el instalador:
          </Text>
          <code className="bg-muted block w-full overflow-x-auto rounded-lg p-3 text-sm">
            {`https://geekbaku.valhalla.monster${APK_URL}`}
          </code>
          <Button render={<a href={APK_URL} />} className="w-fit">
            <DownloadIcon />
            Descargar el .apk
          </Button>
          <Text variant="muted" className="text-xs">
            Al instalar por primera vez, Android va a pedir permiso para "instalar apps de fuentes
            desconocidas" — es normal, acepta y sigue.
          </Text>
        </CardContent>
      </Card>
    </Container>
  );
}
