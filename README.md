# GeekBaku Frontend

Proyecto base del frontend de GeekBaku. Ver `docs/frontend-architecture.md` para el diseño completo de arquitectura (sistema de diseño, navegación, gestión de estado, integración con API, tema visual y guía de UX).

- `docs/design-system.md` — sistema de diseño (Sprint 2): colores, tipografía, componentes reutilizables.
- `docs/pages.md` — páginas del catálogo de anime (Sprint 3, con datos mock — histórico).
- `docs/api-integration.md` — capa de API + React Query + infinite scroll (Sprint 4, sobre datos mock — histórico).
- `docs/backend-integration.md` — conexión del catálogo al backend real (Sprint 5): contrato verificado en vivo, mapeo de vistas a endpoints.
- `docs/auth-integration.md` — **autenticación** (Sprint 9): login/registro/perfil/settings, persistencia de sesión, refresh automático, guards de ruta y de permisos.
- `docs/playback-integration.md` — **reproducción**: `/anime/[id]/watch/[episodeId]`, sesiones de reproducción, selección de fuente/calidad/subtítulo, progreso, episodio siguiente/anterior.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://motion.dev)
- [TanStack Query](https://tanstack.com/query) (cache de cliente + infinite scroll del catálogo — ver `docs/backend-integration.md`)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) (formularios de auth/perfil/settings — ver `docs/auth-integration.md`)
- [next-themes](https://github.com/pacocoursey/next-themes) (dark-first)
- ESLint + Prettier (con `prettier-plugin-tailwindcss`)

## Requisitos

- Node.js 20+
- npm
- El backend de GeekBaku corriendo (ver `../backend`), con el módulo Identity montado (`/api/v1/auth/*`). Sin él, todas las vistas muestran sus estados de error/vacío correctamente, pero no habrá datos reales ni sesión posible.

## Getting started

```bash
npm install
cp .env.example .env.local   # ajustar BACKEND_INTERNAL_HOST si el backend no corre en localhost:8000
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

En desarrollo verás un botón flotante de **React Query Devtools** (esquina inferior izquierda) — muestra en vivo las queries activas, su estado y su cache.

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `BACKEND_INTERNAL_HOST` | `geek-back:8001` | Host:puerto del backend en la network interna de Docker/Podman. Runtime env (leída en cada request, no requiere rebuild). Ajustar al nombre real del servicio si el compose no usa `geek-back`. |

**Un solo camino para todo el tráfico al backend**: tanto el navegador como el servidor (RSC) piden
siempre la ruta relativa `/api/v1` (`resolveApiBaseUrl()` en `src/lib/http.ts`). Esa ruta cae en el
propio servidor Next y la resuelve el Route Handler `src/app/api/v1/[...path]/route.ts`, que lee
`BACKEND_INTERNAL_HOST` en cada request y hace de proxy hacia `http://${BACKEND_INTERNAL_HOST}/api/v1/*`.
Antes existía un segundo camino (`BACKEND_INTERNAL_URL`, solo para RSC, directo al backend sin pasar
por el Route Handler) — se eliminó porque dos variables para lo mismo se podían desincronizar y hacer
que una parte del sitio funcionara y otra no sin motivo aparente. También se descartó resolver esto
con el `rewrites()` de `next.config.ts`: esa función se resuelve una sola vez durante `next build` y
queda congelada en `.next/routes-manifest.json` — cambiar `BACKEND_INTERNAL_HOST` en runtime no tenía
ningún efecto. Un Route Handler sí re-ejecuta su código (y lee `process.env`) en cada request.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica formato sin escribir cambios |

## Estructura del proyecto

```
src/
  app/                     # Rutas (App Router)
    (account)/              # /profile, /settings — protegidas por AuthGuard (route group, no afecta la URL)
    login/, register/, forgot-password/
  components/
    ui/                     # Componentes shadcn/ui
    base/                   # Componentes de marca reutilizables (Sprint 2) — incluye FormField
    layout/                 # Navbar, Sidebar, Footer, shell del sitio
    query-provider.tsx      # QueryClientProvider (React Query)
  features/
    anime/                  # Catálogo — ver docs/backend-integration.md
    playback/               # Reproducción — ver docs/playback-integration.md
    auth/
      api/
        http-client.ts       # Fetchers puros (register/login/logout/refresh/me/profile/settings)
        types.ts              # Tipos del dominio (mapeados del OpenAPI real)
      components/             # Formularios + guards (AuthGuard, GuestGuard, PermissionGuard, UserMenu)
      session-manager.ts       # Singleton dueño del estado de sesión (no un Context)
      use-auth.ts               # Hook React (useSyncExternalStore) sobre el singleton
      token-storage.ts          # Persistencia en localStorage
      schemas.ts                 # Validación Zod de los formularios
  hooks/                    # Hooks genéricos (debounce, mobile, etc.)
  lib/
    http.ts                  # Fetch central compartido (timeout, parseo de error)
    api-error.ts              # ApiError + helpers (isNotFoundError, isUnauthorizedError, isConflictError)
```

## Componentes shadcn/ui

Para añadir un componente nuevo:

```bash
npx shadcn@latest add <componente>
```

## Docker

No hace falta ningún build arg para conectar con el backend — `BACKEND_INTERNAL_HOST` es una env
var normal de runtime, se puede cambiar sin rebuildear la imagen.

Build de la imagen:

```bash
docker build -t geekbaku-frontend .
```

Ejecutar el contenedor:

```bash
docker run -p 3000:3000 -e BACKEND_INTERNAL_HOST=geek-back:8001 geekbaku-frontend
```

La imagen usa el modo `standalone` de Next.js (build multi-stage, usuario no-root, sin dependencias
de desarrollo en runtime, `HEALTHCHECK` sobre `/`).

### nginx (reverse proxy de producción)

`nginx.conf` en la raíz es la config de un nginx aparte (su propio contenedor/servicio), delante
del contenedor de la app — no hay `docker-compose.yml` acá, el wiring de red entre ambos lo resuelve
la infraestructura de despliegue. Antes de usarlo:

- Ajustar `set $app_upstream "app:3000";` al nombre de servicio/IP real del contenedor de la app en
  ese entorno.
- Se asume terminación TLS upstream (load balancer/ingress/Cloudflare) — nginx recibe tráfico plano
  en el puerto 80. Si nginx debe terminar TLS él mismo, agregar un `server` en el puerto 443 con
  `ssl_certificate`/`ssl_certificate_key`.
- Cachea agresivamente `/_next/static/` (assets versionados por hash, nunca cambian de contenido
  bajo la misma URL); todo lo demás pasa directo al servidor de Next.js.

## Convenciones

- No estilos inline: todo a través de utilidades Tailwind o variantes (`cva`).
- Mobile-first, dark-first (ver tokens en `src/app/globals.css`).
- Sin lógica de backend en el frontend: todos los datos vienen de `features/*/api/`, que consumen la API real — ver `docs/backend-integration.md` y `docs/auth-integration.md`.
- Los tokens de sesión viven en `localStorage` (el backend no usa cookies httpOnly todavía) — ver el trade-off documentado en `docs/auth-integration.md`.
- Sin favoritos ni historial todavía (fuera de alcance de este sprint).
