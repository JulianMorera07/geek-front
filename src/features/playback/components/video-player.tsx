export interface VideoPlayerProps {
  src: string;
  title: string;
}

/**
 * Las fuentes reales del backend (`mega.nz/embed/...`, `voe.sx/e/...`,
 * `yourupload.com/embed/...`) son páginas de embed de terceros, no archivos
 * de video directos — un `<video src>` nativo no puede reproducirlas (son
 * HTML, no media). Por eso esto es un `<iframe>`, no un `<video>`. Como
 * consecuencia, no hay acceso a `currentTime`/`duration` del reproductor
 * embebido (cross-origin) — el progreso se rastrea aproximado por tiempo en
 * pantalla desde `WatchPageClient`, no desde acá.
 */
function VideoPlayer({ src, title }: VideoPlayerProps) {
  return (
    <iframe
      key={src}
      src={src}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-xl border-0 bg-black"
    />
  );
}

export { VideoPlayer };
