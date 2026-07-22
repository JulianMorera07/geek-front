# GeekBaku — Sprint 5: Conexión al backend real

Se eliminó por completo la capa mock (`src/features/anime/mock/`, `mock-server.ts`) y el frontend
ahora consume la API real de `geekbaku-backend` (FastAPI). **Sin autenticación, favoritos ni
historial** — fuera de alcance de este sprint.

## Índice

1. [Estado real del backend al momento de este sprint](#1-estado-real-del-backend-al-momento-de-este-sprint)
2. [Los dos mundos de datos: catálogo interno vs Provider Framework](#2-los-dos-mundos-de-datos-catálogo-interno-vs-provider-framework)
3. [Configuración](#3-configuración)
4. [Cliente HTTP](#4-cliente-http)
5. [Mapeo de vistas → endpoints](#5-mapeo-de-vistas--endpoints)
6. [Cache de cliente (React Query)](#6-cache-de-cliente-react-query)
7. [Optimización de navegación](#7-optimización-de-navegación)
8. [Decisiones de producto derivadas del contrato real](#8-decisiones-de-producto-derivadas-del-contrato-real)
9. [Qué falta del lado del backend](#9-qué-falta-del-lado-del-backend)

---

## 1. Estado real del backend al momento de este sprint

Antes de escribir código se verificó el contrato **en vivo** contra `http://localhost:8000` (no se
asumió nada del código del backend sin probarlo):

- `GET /api/v1/openapi.json` — spec real, base de todos los tipos en `features/anime/api/types.ts`.
- El catálogo interno (`/anime`, `/anime/:id`, `/anime/:id/episodes`, `/genres`, `/catalog`) devuelve
  **500** hoy: no hay un adapter de `CatalogUnitOfWork` (SQLAlchemy) conectado todavía.
- El Provider Framework (`/search`, `/latest`, `/popular`) no falla, pero puede tardar **más de 90
  segundos** o devolver `[]` — intenta llamar a proveedores externos reales (Jikan) desde un entorno
  sin salida a internet estable.

Esto **no bloqueó la integración**: es exactamente el escenario para el que existen los estados de
loading/error/vacío. El frontend está construido para funcionar correctamente en cuanto el backend
complete su parte — no requiere cambios adicionales del lado del cliente.

## 2. Los dos mundos de datos: catálogo interno vs Provider Framework

| | Catálogo interno | Provider Framework |
|---|---|---|
| Endpoints | `/anime`, `/anime/:id`, `/anime/:id/episodes`, `/genres`, `/genres/:id`, `/catalog` | `/search`, `/latest`, `/popular` |
| Identidad | `id` propio (UUID), estable | **sin `id`** — solo `title`/`thumbnail_url`/`year`/`sources[]` |
| Paginación | Real (`items/total/page/page_size`) | Ninguna (array plano) |
| Filtros | `status`, `type`, `genre_id` (uno a la vez, no arrays) | Ninguno (solo `page`/`page_size`) |
| Orden | No expone `sort` | No expone `sort` |
| Uso en el frontend | Detalle, Episodios, Búsqueda, Género (siempre clickeable) | Populares, Últimos, filas de Home (informativo) |

**Por qué esto importa**: los resultados de `/popular` y `/latest` no se pueden linkear directo a
`/anime/[id]` porque no traen un id del catálogo interno. Se decidió (confirmado con el usuario)
que el click en esas cards navega a `/search?q=<título>` — nuestra búsqueda interna real — como la
única forma confiable de intentar llegar al Detalle desde un resultado externo.

**Corrección post-Sprint 5**: la página `/search` originalmente solo consultaba el catálogo interno
(`GET /anime?q=`) — que sigue vacío por defecto — por lo que una búsqueda real como "Youjo Senki II"
no mostraba nada, aunque `GET /api/v1/search?q=Youjo Senki II` sí devuelve resultados reales del
Provider Framework. Ahora `/search` usa el catálogo interno como fuente primaria y, cuando no
encuentra nada ahí, muestra además los resultados de `GET /search` como "Resultados externos". Ver
`useSearchInfiniteQuery` en `features/anime/api/queries.ts`.

**Corrección post-implementación de playback**: el backend agregó `GET
/anime/external/:providerId/:externalId` — un puente que ingiere un resultado del Provider Framework
al catálogo interno bajo demanda. Con esto, los resultados sin `id` (Populares, Últimos, externos de
Búsqueda) **ya son clickeables**: `DiscoveryCard` enlaza a `/anime/external/:providerId/:externalId`,
que ingiere el anime (si hace falta) y redirige a la ficha real — ya no hace falta pasar por
`/search?q=<título>` como intermediario. Ver `docs/playback-integration.md` sección 2. También se
detectó que el provider externo activo cambió de `animeflv` a `tioanime` sin aviso — el contrato de
`/search`/`/latest`/`/popular` no cambió, pero los `provider_id` sí, y el nuevo provider no informa
`thumbnail_url` (siempre `null`).

## 3. Configuración

```
BACKEND_INTERNAL_URL=http://localhost:8000/api/v1
```

Definido en `.env.local` (no versionado) con `.env.example` como referencia. Se usa tanto en
Server Components (fetch directo en el servidor) como en Client Components (React Query en el
navegador) — por eso el prefijo `NEXT_PUBLIC_`.

`next.config.ts` permite cualquier host `https` en `images.remotePatterns`: las imágenes vienen de
proveedores externos variados (Jikan/MAL y otros), no de un CDN propio con host fijo.

## 4. Cliente HTTP

`src/features/anime/api/http-client.ts` — un único `apiFetch<T>()` central:

- **Timeout de 10s por request** (`AbortController`). Medido en vivo: `/popular` puede tardar más
  de 90 segundos sin este límite, colgando la página entera. Pasado el timeout se lanza un
  `ApiError` (`code: "TIMEOUT"`) que los estados de error ya manejan — no hace falta lógica nueva.
- `cache: "no-store"` en todos los fetches: sin esto, Next.js cachea el `fetch` del servidor en
  build time y la Home terminaba marcada `○ Static` (datos congelados del momento del build). Con
  `no-store`, la ruta pasa a `ƒ Dynamic` — siempre pide datos frescos al backend real.
- Parsea el shape de error consistente del backend (`{"error": {"code","message"}}`) y tolera
  respuestas no-JSON (tracebacks en texto plano cuando el backend corre con `debug=true`).
- Mappers explícitos snake_case → camelCase (`mapAnimeSummary`, `mapEpisode`, etc.) — el resto del
  frontend nunca ve una key en snake_case.

`src/lib/api-error.ts` (`ApiError`, `isNotFoundError`) se mantiene igual que en el sprint anterior
— ya estaba diseñado para ser agnóstico del origen de datos.

## 5. Mapeo de vistas → endpoints

| Vista | Endpoint(s) | Notas |
|---|---|---|
| Home | `/anime?status=ongoing` + `/popular` + `/latest` + `/genres` | Cada sección se pide por separado (`Promise.all` + `.catch()` individual) y degrada de forma independiente — si el catálogo falla, discovery igual se muestra |
| Buscar / Resultados | `/anime?q=&genre_id=&status=&type=&page=` | Catálogo interno, no `/search` — así los resultados tienen `id` y son clickeables. Filtros combinables con la búsqueda |
| Detalle | `/anime/:id` | Server Component, `notFound()` en 404 real |
| Episodios | `/anime/:id/episodes` | El backend no pagina — devuelve todo; la paginación es solo de presentación en el cliente |
| Relacionados (Detalle) | `/anime/:id` × N (`relations[].related_anime_id`) | `useQueries` en paralelo, acotado al tamaño de `relations` |
| Populares | `/popular` | Provider Framework, scroll infinito, sin filtros |
| Últimos | `/latest` | Ídem — ya no es un feed de episodios (Sprint 3/4), es un feed de animes agregados |
| Géneros | `/genres`, `/genres/:id` | Grid de géneros (Home/Sidebar) y header de Genre View |
| Filtros | `/catalog` (facetas) + `/anime?genre_id=&status=&type=` | Género/estado/tipo, selección única (la API no acepta arrays ni `sort`) |

## 6. Cache de cliente (React Query)

`src/features/anime/api/queries.ts` — hooks + `animeKeys` (factory de query keys). Sin cambios de
fondo respecto al sprint anterior, solo adaptado al contrato real:

- `useCatalogInfiniteQuery` — scroll infinito con `hasNextPage` **exacto** (`page * pageSize <
  total`, el catálogo interno sí devuelve `total`).
- `usePopularInfiniteQuery` / `useLatestInfiniteQuery` — scroll infinito con `hasNextPage`
  **heurístico** (`items.length >= pageSize`), porque `/popular`/`/latest` no devuelven `total`.
- `useAnimeDetailQuery`, `useAnimeEpisodesQuery`, `useGenresQuery`, `useGenreQuery`,
  `useCatalogFacetsQuery`, `useRelatedAnimesQuery` (`useQueries` en paralelo).
- `staleTime` por tipo de dato: géneros/facetas 5 min (cambian poco), detalle/episodios 60s.
- `QueryProvider` (`retry: 1`, `refetchOnWindowFocus: false`) sin cambios — ver Sprint 4.

## 7. Optimización de navegación

- **Prefetch on hover**: `AnimeCard` dispara `queryClient.prefetchQuery` del detalle al hacer hover
  (`onMouseEnter`) — al hacer click, el detalle casi siempre ya está en cache y la navegación se
  siente instantánea.
- **`generateStaticParams` eliminado** de `/anime/[id]` y `/genre/[id]`: con datos mock (Sprint 3/4)
  tenía sentido pre-generar cada página en build; con un backend real y dinámico, esas rutas ahora
  son `ƒ Dynamic` (SSR on-demand) — no tiene sentido "congelar" contenido que cambia en el backend.
- **`Link` de Next.js** ya prefetchea el código de la ruta por defecto (comportamiento nativo, sin
  configuración adicional).
- **Debounce de búsqueda** (`useDebouncedValue`, 350ms) — evita un request por cada tecla.

## 8. Decisiones de producto derivadas del contrato real

Todas confirmadas con el usuario durante este sprint:

1. **Rutas por `id`, no por `slug`**: la API solo permite `GET /anime/{id}` y `GET /genres/{id}`
   (no hay lookup por slug) — las rutas pasaron de `/anime/[slug]` a `/anime/[id]`.
2. **Cards de discovery navegan a la búsqueda interna** (sección 2) en vez de no ser clickeables.
3. **Filtros de selección única** (género/estado/tipo) en vez de multi-select — la API solo acepta
   un valor por filtro. `FilterBar` ganó un modo `mode: "single"` (radio items) para esto.
4. **Sin control de "Ordenar por"**: la API no expone `sort` en ningún endpoint — se quitó del todo
   en vez de fingir un ordenamiento client-side sobre datos parcialmente paginados (sería incorrecto
   mostrar "ordenado" cuando solo se ve una página del total).
5. **Imágenes reales**: `MediaCover` ahora renderiza `next/image` cuando `thumbnail_url` viene del
   backend, con fallback al gradiente placeholder cuando no.

## 9. Qué falta del lado del backend

Fuera de alcance para este agente (frontend), pero documentado para que quede explícito qué
desbloquea qué:

- **Adapter de `CatalogUnitOfWork`** (SQLAlchemy): sin esto, `/anime`, `/anime/:id`,
  `/anime/:id/episodes`, `/genres`, `/genres/:id`, `/catalog` seguirán devolviendo 500. Todo el
  frontend ya está listo para consumirlos apenas respondan.
- **Conectividad real a proveedores externos** (Jikan) o datos de provider ya cacheados/sembrados:
  sin esto, `/popular`, `/latest` seguirán devolviendo `[]` o tardando cerca del timeout de 10s.

Ninguno de estos dos puntos requiere cambios en el frontend — es exactamente el propósito de los
estados de loading/error/vacío ya implementados.
