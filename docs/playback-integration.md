# GeekBaku — Reproducción de episodios (playback)

Completa el flujo "buscar → ver → reproducir". Este documento cubre el módulo
`src/features/playback/`, la ruta `/anime/[id]/watch/[episodeId]`, y el puente
`/anime/external/[providerId]/[externalId]` que conecta un resultado externo (sin `id` propio) con
el catálogo interno.

## Índice

1. [Contrato verificado en vivo](#1-contrato-verificado-en-vivo)
2. [El puente: de resultado externo a anime reproducible](#2-el-puente-de-resultado-externo-a-anime-reproducible)
3. [Arquitectura](#3-arquitectura)
4. [Decisiones de diseño](#4-decisiones-de-diseño)
5. [Sesiones de reproducción y resume point](#5-sesiones-de-reproducción-y-resume-point)
6. [Estados de la página](#6-estados-de-la-página)
7. [Limitaciones conocidas](#7-limitaciones-conocidas)

---

## 1. Contrato verificado en vivo

El contrato del backend cambia entre sprints (el provider externo activo pasó de `animeflv` a
`tioanime` sin aviso) — por eso cada sprint se re-verifica en vivo contra `http://localhost:8000`
en vez de asumir que el contrato anterior sigue vigente:

- `GET /animes/:animeId/episodes/:episodeId/playback` — metadata + fuentes + calidades disponibles.
- `GET /animes/:animeId/seasons/:seasonNumber/episodes/:episodeNumber/next|previous` — referencia al
  episodio adyacente, o `null` si es el primero/último.
- `GET /anime/external/:providerId/:externalId` — puente descrito en la sección 2.
- `POST /playback/sessions` — crea una sesión (anónima, sin auth).
- `POST /playback/sessions/:id/source|quality|subtitle|progress` — actualiza la sesión.
- `GET /playback/sessions/:id/resume-point` — punto de reanudación.

Hallazgos del contrato:

- `quality` es un enum estricto `sd|hd|fhd|uhd` — `"1080p"` devuelve `422`. `StreamQuality` en
  `api/types.ts` refleja exactamente estos cuatro valores.
- `source_id`/`episode_id` deben ser UUID válido — un valor no-UUID devuelve `422`.
- **Las fuentes de streaming (`PlaybackSource.url`) son páginas de embed de terceros** (`mega.nz/embed/...`,
  `voe.sx/e/...`, `yourupload.com/embed/...`), no archivos de video directos. Un `<video src>` nativo
  no puede reproducirlas — son HTML pensado para `<iframe>`, no un stream. `VideoPlayer` es un
  `<iframe>`, no un `<video>` (ver sección 4).
- Como el reproductor es un iframe cross-origin, no hay acceso a `currentTime`/`duration` reales — el
  progreso se aproxima con tiempo transcurrido en pantalla (ver sección 5).
- `thumbnail_url` viene `null` en todo el catálogo hoy (anime, episodios, `/search`, `/latest`,
  `/popular`) — es una limitación de datos del provider activo (`tioanime`), no un bug de fetch/CORS
  del frontend. `MediaCover` ya cae a un placeholder con el título cuando no hay URL.
- Las sesiones son **anónimas**: no requieren `Authorization`.

## 2. El puente: de resultado externo a anime reproducible

`/search`, `/latest` y `/popular` (Provider Framework) devuelven resultados sin `id` de catálogo
interno — no se puede armar `/anime/[id]` directo desde ahí. El backend expone
`GET /anime/external/:providerId/:externalId` para resolver esto: si el anime ya fue ingerido antes
devuelve la copia interna; si no, lo trae del provider (detalle + episodios + fuentes), lo persiste
como `Anime`/`Episode`/`StreamingSource`, y devuelve el detalle ya listo para reproducir.

El frontend usa este endpoint a través de una ruta puente:

```
src/app/anime/external/[providerId]/[externalId]/page.tsx
```

Server Component: llama a `fetchAnimeByExternalReference`, y hace `redirect(/anime/${anime.id})`. Si
el provider no tiene ese `external_id`, `notFound()`. Como la ingesta puede tardar (el backend
scrapea al provider en el momento), tiene su propio `loading.tsx` y un timeout de 30s
(`EXTERNAL_INGEST_TIMEOUT_MS` en `http-client.ts`, mayor al default de 10s).

`DiscoveryCard` (usada en Populares, Últimos, y los resultados externos de Búsqueda) enlaza a esta
ruta usando `result.sources[0]` (la fuente de mayor prioridad) — ya no hay ningún resultado de
Provider Framework "no clickeable": todos llevan a una ficha real, ingiriendo el anime al catálogo
interno en el momento del click si hace falta.

## 3. Arquitectura

```
src/features/playback/
├── api/
│   ├── types.ts              # Tipos camelCase (StreamQuality, EpisodePlayback, PlaybackSession, ...)
│   ├── http-client.ts         # fetch + mappers snake_case → camelCase
│   └── queries.ts              # hooks de React Query (queries + mutations)
├── labels.ts                   # qualityLabel(): sd→SD, hd→HD, fhd→Full HD, uhd→4K
├── session-storage.ts          # persistencia del sessionId en localStorage, por episodio
└── components/
    ├── video-player.tsx        # <iframe> — las fuentes son embeds de terceros, no video directo
    ├── source-selector.tsx     # <Select> de servidor/calidad/audio
    ├── subtitle-selector.tsx   # <Select> de subtítulo, con opción "Ninguno"
    ├── episode-navigation.tsx  # botones anterior/siguiente
    └── watch-page-client.tsx   # orquestador: une todo lo anterior
```

Rutas:
- `/anime/[id]/watch/[episodeId]` — reproductor (`page.tsx` + `loading.tsx`).
- `/anime/external/[providerId]/[externalId]` — puente de ingesta (sección 2).

`EpisodeCard` (`features/anime/components/episode-card.tsx`) enlaza a la ruta de reproducción.

## 4. Decisiones de diseño

- **No se implementaron `/playback/sources`, `/playback/subtitles`, `/playback/qualities` como
  funciones separadas**: son redundantes con lo que ya trae `fetchEpisodePlayback` en una sola
  llamada.
- **`EpisodePlayback.metadata` es la fuente de verdad para `seasonNumber`/`episodeNumber`** al armar
  las queries de episodio siguiente/anterior — no `AnimeDetail.seasons[]`.
- **`VideoPlayer` es un `<iframe>`, no un `<video>`**: las fuentes reales son páginas de embed de
  terceros (ver sección 1). Se perdió la posibilidad de controlar programáticamente el reproductor
  (seek automático al resume point, lectura de `currentTime`) — es una limitación real del origen de
  los datos, no una simplificación de scope.
- **Selección de fuente/subtítulo con estado derivado, no `useEffect` + `setState`**: `WatchPageClient`
  calcula la fuente/subtítulo "efectivos" en cada render (`manualXxx ?? default`) y solo resetea la
  selección manual ajustando el estado **durante el render** cuando cambia `episodeId` (evita el lint
  `react-hooks/set-state-in-effect`).
- **`Select.Value` de Base UI necesita `children` como función**: a diferencia de Radix, no infiere la
  etiqueta desde los `Select.Item` — mostraba el `value` crudo (el UUID de la fuente) en vez del texto
  legible. `SourceSelector`/`SubtitleSelector` ahora pasan `children={(value) => ...}` a `SelectValue`.
  (El mismo patrón sin la función en `settings-form.tsx` no se nota porque ahí los `value` ya parecen
  texto legible — queda anotado como deuda, fuera de alcance de este fix.)

## 5. Sesiones de reproducción y resume point

**El `sessionId` se persiste en `localStorage`** (`session-storage.ts`), por `episodeId`, no en
estado de React efímero. Sin esto cada visita creaba una sesión nueva y el resume point de la sesión
anterior quedaba inalcanzable — funciona igual logueado o no, porque las sesiones del backend ya son
anónimas; `localStorage` es lo que le da continuidad a la sesión anónima entre visitas en el mismo
navegador.

Al entrar a un episodio:

1. Se busca un `sessionId` guardado para ese `episodeId`. Si existe, se reutiliza (no se crea una
   sesión nueva). Si no, se crea (`POST /playback/sessions`) y se guarda el `id` devuelto.
2. Se sincroniza la fuente/calidad con la sesión.
3. Se consulta el resume point (`GET .../resume-point`). Como el reproductor es un iframe, no se
   puede hacer seek automático — se muestra como texto informativo ("Ibas por el minuto M:SS") para
   que el usuario retome manualmente desde los controles del proveedor externo.
4. El progreso se aproxima con **tiempo transcurrido en pantalla** (un contador que arranca desde el
   resume point conocido) y se guarda cada ~10s. Cuando el backend no informa `duration_seconds` real
   (típico en fuentes externas), se usa un estimado de ~24 min — **nunca** `elapsed + 1`: eso deja el
   porcentaje siempre en ~100% y el backend marca la sesión como completada casi al instante,
   destruyendo el resume point (bug real encontrado y corregido durante la validación de este sprint).

## 6. Estados de la página

- **Loading**: skeleton (`loading.tsx` a nivel de ruta + `WatchPageSkeleton`).
- **Error 404** (anime o episodio inexistente): "Episodio no encontrado", sin botón de reintentar.
- **Error genérico** (timeout, red, 5xx): `ErrorView` con botón "Reintentar".
- **Vacío** (`sources.length === 0`): `EmptyState` — "Sin fuentes de reproducción".

Verificado en vivo end-to-end contra el backend real (no solo con UUIDs inventados): búsqueda →
resultado externo (`tioanime`) → ingesta vía el puente → ficha con géneros/sinopsis/episodios reales
→ reproducción (iframe de `mega.nz`) → selector de fuente con etiqueta correcta → sesión creada →
progreso guardado → resume point persistido tras recargar la página.

## 7. Limitaciones conocidas

- **Sin duración real**: el backend no informa `duration_seconds` para las fuentes de este provider
  (`null` en `PlaybackMetadata`), así que el porcentaje de progreso es aproximado (ver sección 5).
- **Sin seek automático**: al ser un iframe de un proveedor externo, no hay forma de posicionar el
  reproductor en el resume point — es informativo, el usuario debe buscarlo manualmente.
- **`thumbnail_url` nulo en todo el catálogo**: limitación de datos del provider activo, no del
  frontend — no hay nada que "arreglar" del lado del cliente hasta que el provider entregue imágenes.
- El entorno puede tener múltiples procesos backend en el puerto 8000 (artefacto ya documentado en
  `docs/auth-integration.md`) — no es un bug de código.
