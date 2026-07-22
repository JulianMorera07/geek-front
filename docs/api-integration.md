# GeekBaku — Sprint 4: Integración con API mock

Conexión del frontend a una capa de API **simulada** (misma forma que tendrá la API real), reemplazando los imports directos de arrays mock del Sprint 3. **Sin backend real, sin autenticación, sin historial, sin favoritos.**

## Índice

1. [Arquitectura de la capa de datos](#1-arquitectura-de-la-capa-de-datos)
2. [Contrato de la API mock](#2-contrato-de-la-api-mock)
3. [React Query: providers y hooks](#3-react-query-providers-y-hooks)
4. [Infinite Scroll](#4-infinite-scroll)
5. [Estados de carga, vacío y error](#5-estados-de-carga-vacío-y-error)
6. [Cómo probar el manejo de errores](#6-cómo-probar-el-manejo-de-errores)
7. [Server Components vs Client Components: quién pide qué](#7-server-components-vs-client-components-quién-pide-qué)
8. [Migración a backend real](#8-migración-a-backend-real)

---

## 1. Arquitectura de la capa de datos

```
src/features/anime/
  mock/           # Sprint 3 — datos crudos (arrays, generadores). Ya no se importan
                  # directo desde componentes de página; solo desde api/mock-server.ts.
  api/
    types.ts      # PaginatedResponse<T>, AnimeQueryParams, EpisodeWithAnime, GenreWithCount
    mock-server.ts # "servidor" simulado: delay + errores + paginación sobre mock/
    queries.ts    # hooks de React Query (useInfiniteQuery/useQuery) + query keys
  components/     # UI — ahora consume api/queries.ts o api/mock-server.ts, no mock/ directo
```

`src/lib/api-error.ts` define `ApiError` (con `status` y `code`) — el único tipo de error que la capa de datos puede lanzar. `isNotFoundError()` lo distingue para decidir cuándo llamar `notFound()` en un Server Component.

## 2. Contrato de la API mock

`src/features/anime/api/mock-server.ts` expone funciones `async` que imitan endpoints reales:

| Función | Equivalente REST |
|---|---|
| `fetchAnimes(params)` | `GET /animes?q=&genres=&status=&sort=&page=&pageSize=` |
| `fetchAnimeBySlug(slug)` | `GET /animes/:slug` (404 real si no existe) |
| `fetchRelatedAnimes(anime, limit)` | `GET /animes/:id/related` |
| `fetchEpisodesByAnimeId(animeId, params)` | `GET /animes/:id/episodes?page=&pageSize=` |
| `fetchLatestEpisodes(params)` | `GET /episodes/latest?page=&pageSize=` |
| `fetchGenres()` | `GET /genres` |
| `fetchGenreBySlug(slug)` | `GET /genres/:slug` (404 real si no existe) |

Todas devuelven `PaginatedResponse<T>` cuando el resultado es un listado:

```ts
interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  hasNextPage: boolean;
}
```

**Episodios traen el anime embebido** (`EpisodeWithAnime`, con `anime: {id, slug, title, coverSeed}`) en vez de que el cliente arme un mapa de lookup a partir de una lista completa aparte — así se evita el patrón N+1 y se simplifica `EpisodeCard`/`EpisodeList`.

Toda la latencia y los errores simulados viven en un único lugar (`mock-server.ts`): `NETWORK_DELAY_MS` (450ms) y `RANDOM_ERROR_RATE` (6%, solo cliente — ver sección 6).

## 3. React Query: providers y hooks

- `src/components/query-provider.tsx` — un `QueryClient` por sesión de navegador (`useState` lazy init), montado en `src/app/layout.tsx`. `retry: 1`, `staleTime: 30s`, `refetchOnWindowFocus: false`. Incluye `ReactQueryDevtools` solo en desarrollo (botón flotante, esquina inferior izquierda — muestra las query keys y su estado en vivo).
- `src/features/anime/api/queries.ts` — hooks + `animeKeys` (factory de query keys centralizada):
  - `useAnimesInfiniteQuery(params)` — listados de animes con scroll infinito.
  - `useEpisodesQuery(animeId, {page, pageSize})` — episodios de un anime, paginación clásica.
  - `useLatestEpisodesInfiniteQuery()` — feed de últimos episodios, scroll infinito.
  - `useGenresQuery()` — catálogo de géneros (con conteo), `staleTime` largo (5 min) porque cambia poco.

## 4. Infinite Scroll

`src/components/base/infinite-scroll-trigger.tsx` — sentinela genérico (no sabe nada de anime) basado en `IntersectionObserver`: cuando entra al viewport (con `rootMargin` de anticipación) y `hasMore` es true, dispara `onLoadMore`.

**Dónde se usa infinite scroll y dónde no** (decisión de diseño, no todo listado lo necesita):

| Vista | Estrategia | Por qué |
|---|---|---|
| `/search`, `/popular`, `/genre/[slug]` (grid de animes) | **Infinite scroll** (`AnimeInfiniteGrid`) | Listados que pueden crecer mucho y se consumen "scrolleando" — patrón natural de catálogo |
| `/latest` (feed de episodios) | **Infinite scroll** (`EpisodeInfiniteList`) | Feed continuo por naturaleza, sin necesidad de saltar a una página específica |
| Episodios dentro de `/anime/[slug]` | **Paginación clásica** (`EpisodeList` + `Pagination`) | Dataset acotado (≤26 en el mock) y el usuario suele querer saltar directo a un número de episodio — el scroll infinito lo dificulta |

## 5. Estados de carga, vacío y error

Cada componente conectado a la API maneja explícitamente sus 4 estados (ninguno se deja implícito):

- **Loading inicial**: skeleton con las mismas dimensiones del contenido real (`AnimeGridSkeleton`, `EpisodeListSkeleton`, Sprint 3).
- **Vacío**: `EmptyState` con mensaje contextual (ej. `Sin resultados para "texto"`).
- **Error**: `ErrorView` con botón "Reintentar" que llama `refetch()` de React Query.
- **Cargando más** (scroll infinito): spinner en `InfiniteScrollTrigger`, no bloquea el contenido ya cargado.

## 6. Cómo probar el manejo de errores

La capa mock simula fallas de dos formas:

1. **Determinístico (siempre disponible, server y cliente)**: buscar/pasar el literal `"error"` — ej. `/search?q=error`, `/anime/error`, `/genre/error` — dispara una `ApiError` de forma confiable. Es la manera de QA/demo para ver `ErrorView` sin depender del azar.
2. **Aleatorio (solo en el cliente)**: ~6% de probabilidad de fallo por request en cualquier vista con infinite scroll o filtros. Deliberadamente **excluido del servidor/build** (`typeof window !== "undefined"`) — un fallo aleatorio durante `next build`/SSR rompería el build de forma no determinística, que es peor que no tener flakiness ahí. Combinado con `retry: 1` de React Query, este fallo aleatorio rara vez llega a mostrarse (≈0.36% de que dos intentos seguidos fallen), pero está ahí para quien quiera forzarlo bajando `retry` a `0` en `query-provider.tsx` durante pruebas.

## 7. Server Components vs Client Components: quién pide qué

No todo se movió a React Query — se siguió la convención estándar de Next.js App Router:

- **Server Components** (`/`, `/anime/[slug]`, `/genre/[slug]`) llaman las funciones de `mock-server.ts` directo con `await` — no necesitan cache de cliente ni refetch, así que no usan React Query. `notFound()` se dispara atrapando `isNotFoundError(error)`.
- **Client Components** que necesitan interactividad (input de búsqueda, filtros, orden, scroll infinito, paginación por click) usan los hooks de `queries.ts` — ahí sí hace falta cache, estado de carga por interacción, y reintentos.

Esto evita la complejidade de hidratar el cache de React Query desde el servidor (`dehydrate`/`hydrate`) que no aporta valor real en este sprint.

## 8. Migración a backend real

Cuando exista el backend real, el cambio se concentra casi todo en **un solo archivo**:

1. Reemplazar el contenido de `src/features/anime/api/mock-server.ts` por llamadas `fetch`/cliente HTTP real, manteniendo exactamente las mismas firmas de función y los mismos tipos de retorno (`PaginatedResponse<T>`, `ApiError`). Ningún componente ni hook debería necesitar cambios.
2. Eliminar `src/features/anime/mock/` (los datos ya no se generan localmente).
3. Los query keys, `useInfiniteQuery`/`useQuery`, y los estados de loading/error/empty siguen funcionando igual — React Query no sabe (ni le importa) si el `queryFn` habla con mock o con una API real.
