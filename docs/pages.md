# GeekBaku — Sprint 3: Páginas y datos mock

Construcción de la estructura visual completa del catálogo de anime sobre el Design System del Sprint 2. **Sin backend, sin autenticación** — todo el contenido viene de `src/features/anime/mock/`.

## Índice

1. [Alcance y decisiones](#1-alcance-y-decisiones)
2. [Datos mock](#2-datos-mock)
3. [Páginas](#3-páginas)
4. [Componentes de dominio (feature)](#4-componentes-de-dominio-feature)
5. [Loading, Skeleton, Error, Empty](#5-loading-skeleton-error-empty)
6. [Shell del sitio (Navbar + Sidebar + Footer)](#6-shell-del-sitio-navbar--sidebar--footer)
7. [Responsive y Dark Mode](#7-responsive-y-dark-mode)
8. [Bugs reales encontrados y corregidos](#8-bugs-reales-encontrados-y-corregidos)
9. [Cómo migrar de mock a API real](#9-cómo-migrar-de-mock-a-api-real)

---

## 1. Alcance y decisiones

- **Sin distinción marketing/app**: dado que no hay autenticación todavía, se usa un único shell (`SiteShell`) para todo el sitio, montado en `src/app/layout.tsx`. La separación en grupos de rutas `(marketing)/(app)/(auth)` propuesta en `docs/frontend-architecture.md` se implementará cuando exista auth real.
- **"Episode List" es una sección, no una ruta propia**: se decidió embeber la lista de episodios dentro de **Anime Detail** (`/anime/[slug]`), que es el patrón estándar en sitios de anime (Crunchyroll, MAL). El componente `EpisodeList` es igualmente reutilizable y también alimenta `/latest`.
- **"Latest" = últimos episodios, no últimos animes**: `/latest` lista episodios ordenados por fecha de lanzamiento (`Episode.releasedAt`), no animes — es la interpretación estándar de "latest" en un catálogo de anime.
- **Paginación y filtros son 100% client-side** sobre el array mock completo (client components con `useState`). No están sincronizados con la URL todavía — es la primera mejora a hacer cuando se conecte paginación real de API (server-side).
- **Covers**: no hay imágenes reales todavía. `MediaCover` (Sprint 2) genera un gradiente determinístico por `seed` + label tipográfico. Cuando el backend exponga URLs de imagen, `MediaCover` acepta un prop `src` para renderizar `next/image` en su lugar sin cambiar la API de los componentes que lo consumen (`AnimeCard`, `EpisodeCard`, `GenreCard`, `Banner`).

## 2. Datos mock

`src/features/anime/`

```
types.ts               # Anime, Episode, Genre, AnimeFiltersState, SortOption
mock/
  animes.ts            # 24 animes (seed determinístico, sin datos reales/con copyright)
  episodes.ts          # episodios generados por anime (según episodeCount)
  genres.ts             # 12 géneros
  utils.ts              # simulateNetworkDelay, filterAnimes, sortAnimes, searchAnimes, paginate
```

- **`simulateNetworkDelay(ms)`**: único punto que simula latencia de red. Se usa en los Server Components de página (`await simulateNetworkDelay(400)`) exclusivamente para poder demostrar los estados `loading.tsx`/Skeleton — **se elimina en el momento de conectar el backend real**, junto con todo el contenido de `mock/`.
- Todas las funciones de filtrado/orden/paginación (`filterAnimes`, `sortAnimes`, `searchAnimes`, `paginate`) son puras y no dependen de React — se reemplazan por parámetros de query a la API real, no por lógica nueva en los componentes.

## 3. Páginas

| Ruta | Tipo | Contenido |
|---|---|---|
| `/` | Server (async) | `Banner` (top 5 por popularidad) + 3 `AnimeRow` (Populares/Recién actualizados/Mejor calificados) + `GenreGrid` |
| `/search` | Server → `SearchPageClient` | `SearchInput` + `AnimeFilters` + `AnimeGrid`, lee `?q=` inicial |
| `/anime/[slug]` | Server (async, SSG vía `generateStaticParams`) | Header (cover + badges + sinopsis) + `EpisodeList` + `AnimeRow` "Similares" |
| `/genre/[slug]` | Server → `GenrePageClient` | Header + sort + `AnimeGrid` filtrado por género |
| `/latest` | Server (async) | `EpisodeList` de los últimos episodios de todo el catálogo |
| `/popular` | Client (`PopularPageClient`) | `AnimeFilters` (género/estado/orden, default popularidad) + `AnimeGrid` |

Todas las páginas están envueltas por `SiteShell` (Navbar + Sidebar + Footer) desde el layout raíz — no se repite en cada página.

Rutas especiales: `src/app/not-found.tsx` (EmptyState) y `src/app/error.tsx` (ErrorView, `"use client"`, con `reset()`).

## 4. Componentes de dominio (feature)

`src/features/anime/components/` — reutilizables dentro del dominio anime (a diferencia de `components/base` y `components/layout`, que son agnósticos de dominio):

| Componente | Uso |
|---|---|
| `AnimeCard` | Poster + badge de estado + rating + overlay de play al hover |
| `EpisodeCard` | Card horizontal (thumbnail 16:9 + título + fecha relativa) |
| `GenreCard` | Card de género con gradiente + conteo |
| `Banner` | Hero autoplay (Framer Motion, respeta `prefers-reduced-motion`) |
| `AnimeRow` | Título + `Carousel` de `AnimeCard` + link "Ver todo" |
| `AnimeGrid` | `Grid` + `AnimeCard` + `Pagination` + `EmptyState` integrados |
| `EpisodeList` | Igual que `AnimeGrid` pero para episodios |
| `GenreGrid` | `Grid` de `GenreCard` con conteo derivado del catálogo |
| `AnimeFilters` | `FilterBar` configurado para género/estado/orden |
| `AnimeSearchCommand` | `SearchCommand` (Sprint 2) alimentado con animes/géneros mock |
| `SearchPageClient` / `GenrePageClient` / `PopularPageClient` | Orquestan estado (query/filtros/orden) de cada página client-side |
| `skeletons.tsx` | `AnimeCardSkeleton`, `EpisodeCardSkeleton`, `BannerSkeleton`, `AnimeRowSkeleton`, `AnimeGridSkeleton`, `EpisodeListSkeleton` — mismas dimensiones que su componente real |

**Patrón de reseteo de paginación**: `AnimeGrid`/`EpisodeList` guardan la página en estado interno. Cuando el listado cambia por un filtro/búsqueda nuevo, el padre fuerza el reset pasando `key={JSON.stringify(filters)}` (patrón estándar de React), en vez de sincronizar con un `useEffect`.

## 5. Loading, Skeleton, Error, Empty

- **`loading.tsx` por ruta** (`/`, `/anime/[slug]`, `/genre/[slug]`, `/latest`, `/popular`, `/search`): usan los skeletons de `features/anime/components/skeletons.tsx`, con las mismas dimensiones aproximadas del contenido real (evita layout shift).
- **`AnimeGrid`/`EpisodeList`** muestran `EmptyState` automáticamente cuando el listado resultante está vacío (sin resultados de búsqueda, género sin animes, etc.), con mensaje contextual (ej. `Sin resultados para "consulta"`).
- **`error.tsx`** raíz usa `ErrorView` con `onRetry={reset}` (Sprint 2).
- **`not-found.tsx`** raíz usa `EmptyState` con acción "Volver al inicio". Se dispara automáticamente vía `notFound()` en `/anime/[slug]` y `/genre/[slug]` cuando el slug no existe.

## 6. Shell del sitio (Navbar + Sidebar + Footer)

`src/components/layout/site-shell.tsx` (nuevo, "use client"), montado en `src/app/layout.tsx`:

- **Sidebar**: navegación primaria (Inicio/Últimos/Populares) + lista de géneros, estado activo calculado con `usePathname()`.
- **Navbar**: logo + `SidebarTrigger` (via `leadingSlot`) + botón de búsqueda (abre `AnimeSearchCommand`) + `ThemeToggle`.
- **Footer**: columnas Explorar/Géneros generadas desde los datos mock.
- **`AnimeSearchCommand`**: paleta ⌘K montada una sola vez en el shell, navega con `next/navigation`'s `router.push`.

## 7. Responsive y Dark Mode

- Mobile-first en todas las páginas: `Grid` con columnas `cards`/`wide`/`compact` (definidas en Sprint 2), `Banner` cambia de aspect-ratio (`16/10` → `21/9` en `sm:`), Sidebar colapsa a `Sheet` en mobile (heredado de `ui/sidebar`).
- Dark mode es el tema por defecto (`defaultTheme="dark"`, Sprint 2) — todas las páginas nuevas usan exclusivamente tokens de color (`bg-background`, `text-muted-foreground`, `bg-brand`, etc.), sin ningún color hardcodeado salvo el texto sobre los covers placeholder (ver sección 8).

## 8. Bugs reales encontrados y corregidos

Verificación en navegador (dev + build de producción) durante este sprint encontró y corrigió:

1. **Contraste roto en overlays de imagen** (`text-background`/`fill-background`/`bg-background` usados sobre los gradientes placeholder de `MediaCover`, `Banner`, `AnimeCard`, `EpisodeCard`, `GenreCard`): en dark mode, `--background` es casi negro, así que el texto quedaba invisible sobre el propio overlay oscuro. Corregido a `text-white`/`bg-black/70` fijos — el placeholder siempre es oscuro independientemente del tema del sitio, así que el texto sobre él no debe atarse al token de tema. Documentado con comentario en `media-cover.tsx` para que no se "corrija" de vuelta.
2. **`Button` con `render={<Link/>}` disparaba un warning de Base UI** ("expected a native `<button>`"): se corrigió en `components/ui/button.tsx` agregando `nativeButton = !render` por defecto — si `Button` renderiza como otro elemento (`render`), asume que no es un `<button>` nativo.
3. **`CommandDialog` no envolvía a sus hijos en `<Command>`** (root de `cmdk`), causando `Cannot read properties of undefined (reading 'subscribe')` al abrir la paleta de búsqueda (⌘K) — reproducible incluso en build de producción. Corregido en `components/ui/command.tsx` envolviendo `{children}` en `<Command>` dentro de `CommandDialog`.

Un cuarto síntoma (hydration mismatch con `data-slot="sidebar-wrapper"` en dev tools) se investigó a fondo comparando el HTML real servido (`curl`) contra lo que el navegador de automatización reportaba: el HTML del servidor era correcto en todos los casos; la discrepancia la introducía una extensión de grabación de pantalla del propio entorno de pruebas (`id="scrnli_recorder_root"` inyectado en el DOM antes de que React hidrate) — **no es un bug del código**, es un falso positivo del entorno de automatización.

## 9. Cómo migrar de mock a API real

Cuando se conecte el backend (próximo sprint):

1. Reemplazar las funciones de `features/anime/mock/` por `features/anime/api/` (fetchers + React Query), manteniendo las mismas firmas donde sea posible (`getAnimeBySlug`, `getEpisodesByAnimeId`, etc.) para minimizar cambios en los componentes de página.
2. Eliminar `simulateNetworkDelay` — el `loading.tsx` de cada ruta seguirá funcionando igual, ahora reflejando latencia real.
3. Mover paginación/filtros de `useState` local a query params de URL + parámetros de la API (server-side pagination), y de ahí a React Query para cache/invalidación.
4. `MediaCover` acepta `src` para imágenes reales — no requiere cambios en `AnimeCard`/`EpisodeCard`/`GenreCard`/`Banner`, solo pasar la URL cuando esté disponible.
