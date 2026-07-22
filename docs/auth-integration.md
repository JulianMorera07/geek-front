# GeekBaku — Sprint 9: Autenticación (módulo Identity)

Experiencia de autenticación completa contra el módulo Identity real del backend. **Sin
favoritos ni historial todavía** — fuera de alcance de este sprint.

## Índice

1. [Contrato real verificado](#1-contrato-real-verificado)
2. [Arquitectura: `AuthSessionManager`, no un Context](#2-arquitectura-authsessionmanager-no-un-context)
3. [Persistencia de sesión y refresh automático](#3-persistencia-de-sesión-y-refresh-automático)
4. [Manejo de expiración del token](#4-manejo-de-expiración-del-token)
5. [Guards: rutas y permisos](#5-guards-rutas-y-permisos)
6. [Páginas y formularios](#6-páginas-y-formularios)
7. [Recuperación de contraseña — pendiente del backend](#7-recuperación-de-contraseña--pendiente-del-backend)
8. [Bugs reales encontrados y corregidos](#8-bugs-reales-encontrados-y-corregidos)
9. [Advertencia de entorno: múltiples procesos del backend](#9-advertencia-de-entorno-múltiples-procesos-del-backend)
10. [Limitaciones conocidas y próximos pasos](#10-limitaciones-conocidas-y-próximos-pasos)

---

## 1. Contrato real verificado

Antes de escribir código se levantó el backend y se probó cada endpoint en vivo (mismo método que
en Sprint 5 — nunca se asume un contrato sin probarlo):

| Endpoint | Auth requerida | Notas |
|---|---|---|
| `POST /auth/register` | No | Devuelve el `User` creado — **sin tokens**. Hay que loguear después. |
| `POST /auth/login` | No | Devuelve `AuthResult` (`access_token`, `refresh_token`, `user`). |
| `POST /auth/logout` | No (solo `refresh_token` en el body) | `204 No Content`. |
| `POST /auth/refresh` | No (solo `refresh_token` en el body) | Rota el refresh token — el usado queda revocado. |
| `GET /auth/me` | Sí (`Bearer`) | |
| `PATCH /auth/profile` | Sí (`Bearer`) | `display_name`, `avatar_url`, `bio`. |
| `PATCH /auth/settings` | Sí (`Bearer`) | `language`, `theme`, `notifications_enabled`. |

Detalles del contrato que cambiaron el diseño:

- **`access_token.expires_in` = 900s (15 min)**, refresh token de larga duración (30 días, opaco).
- **Dos formatos de error distintos**: los errores de dominio (`exception_handlers.py`) devuelven
  `{"error": {"code","message"}}`; los que dispara `HTTPBearer` antes de llegar a un handler (header
  ausente/inválido) devuelven el formato nativo de FastAPI `{"detail": "..."}`, con **403** cuando
  falta el header y **401** cuando el token es inválido/expiró. `src/lib/http.ts` parsea ambos
  formatos y `isUnauthorizedError()` trata 401 y 403 igual (ambos significan "no autenticado").
- **`permissions: string[]`** viene embebido en el `User` (ej. `"profile:update"`, `"admin:manage"`)
  — no hace falta un endpoint separado para armar el guard de permisos.
- No existe lookup por email en ningún GET — todo lo protegido usa el `user_id` del token decodificado.

## 2. Arquitectura: `AuthSessionManager`, no un Context

`src/features/auth/session-manager.ts` — un singleton plano (no un componente React) dueño único
del estado de sesión. Se eligió así en vez de un Context porque **la capa HTTP también necesita el
token** (para el header `Authorization`) y **no es un componente React** — un singleton evita pasar
el token por props/Context hasta la función de fetch más profunda.

```
useAuth() (React, useSyncExternalStore)
        ⇅
authSessionManager (singleton — estado, persistencia, refresh, scheduling)
        ⇅
http-client.ts (fetch puro — recibe el accessToken como parámetro, no lee el manager)
```

`useAuth()` se conecta al singleton vía `React.useSyncExternalStore` (mismo patrón que
`useIsMobile` del Sprint 3) — sin Context, sin re-render innecesario de todo el árbol.

## 3. Persistencia de sesión y refresh automático

- **`localStorage`** (`src/features/auth/token-storage.ts`, clave `geekbaku.auth.session.v1`):
  guarda `user`, `accessToken`, `accessTokenExpiresAt` (epoch ms) y `refreshToken`. Trade-off
  consciente: el backend devuelve los tokens en el body (no `Set-Cookie` httpOnly), así que el
  cliente es quien tiene que persistirlos — no hay otra opción sin cambiar el backend.
  `localStorage` es vulnerable a XSS; migrar a cookies httpOnly + `sameSite` es la mejora natural
  cuando el backend las soporte (ver sección 10).
- **Hidratación al montar** (`AuthSessionManager.hydrate()`, llamado una vez desde `AuthProvider`):
  si el access token sigue vigente, se confía en él de entrada (evita un round-trip extra en cada
  carga de página) y se valida en segundo plano contra `GET /me`; si ya expiró, se intenta un
  refresh antes de decidir el estado.
- **Refresh proactivo**: se programa un `setTimeout` a `expiresAt - 60s` (con `scheduleRefresh`),
  así el access token se renueva antes de expirar, sin que el usuario note nada.
- **Refresh reactivo + dedupe** (`callAuthenticated()`): cualquier llamada autenticada que falle con
  401/403 dispara un refresh único (si ya hay uno en curso, todas las llamadas esperan la misma
  promesa — el backend rota el refresh token, así que dos refresh en paralelo con el token viejo
  fallarían) y reintenta la llamada original una vez.

## 4. Manejo de expiración del token

Dos mecanismos independientes, uno proactivo y uno reactivo:

1. **Proactivo**: el timer programado en `scheduleRefresh()` renueva el token ~1 minuto antes de que
   expire, en la mayoría de los casos el usuario nunca ve un 401 por token vencido.
2. **Reactivo (red de seguridad)**: si por lo que sea el timer no llegó a tiempo (pestaña dormida,
   reloj del sistema, etc.), la primera llamada autenticada que reciba 401/403 dispara el mismo
   flujo de refresh-and-retry. Si el refresh también falla (refresh token vencido o revocado —
   ej. se cerró sesión en otra pestaña), `clear()` deja el estado en `unauthenticated` y cualquier
   `AuthGuard` activo redirige a `/login` automáticamente.

## 5. Guards: rutas y permisos

- **`AuthGuard`** (`features/auth/components/auth-guard.tsx`): protege una ruta — mientras se
  restaura la sesión muestra un loader (nunca parpadea a "no autenticado"); si no hay sesión,
  redirige a `/login?redirect=<ruta>`. Aplicado vía `src/app/(account)/layout.tsx` a `/profile` y
  `/settings` (route group — no cambia la URL).
- **`GuestGuard`** (inverso): en `/login`, `/register`, `/forgot-password` — si ya hay sesión,
  redirige a `/`.
- **`PermissionGuard`** (`features/auth/components/permission-guard.tsx`): oculta una sección
  (no toda la ruta) si el usuario no tiene el permiso/rol requerido, mostrando un `EmptyState`
  inline en su lugar. Demostrado en `/profile` con el permiso real `admin:manage` (solo el rol
  `admin` lo tiene — un usuario recién registrado, con rol `user`, ve el fallback "No tienes
  permiso para ver esto").

**Importante — protección client-side, no middleware**: los guards son componentes React
(`"use client"`), no [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware).
Middleware corre en el Edge y no tiene acceso a `localStorage`; como el backend no usa cookies
httpOnly, no hay nada que el middleware pueda leer en el servidor. Es una limitación real: el HTML
inicial de una ruta protegida sí llega al navegador antes de que `AuthGuard` redirija (aunque sin
datos sensibles, porque los datos del usuario viven en el estado de cliente, no en la página
servida). Migrar a cookies httpOnly habilitaría protección real en el servidor — ver sección 10.

## 6. Páginas y formularios

Todos los formularios usan **React Hook Form + Zod** (`features/auth/schemas.ts`), como especifica
`docs/frontend-architecture.md`.

| Ruta | Componente | Detalle |
|---|---|---|
| `/login` | `LoginForm` | Redirige a `?redirect=` tras loguear, o a `/` |
| `/register` | `RegisterForm` | El backend no devuelve tokens en `/register` — `useAuth().register()` hace login con las mismas credenciales inmediatamente después |
| `/forgot-password` | `ForgotPasswordForm` | Ver sección 7 |
| `/profile` (protegida) | `ProfileForm` + `PermissionGuard` | Edita `display_name`/`avatar_url`/`bio` |
| `/settings` (protegida) | `SettingsForm` | Edita `language`/`theme`/`notifications_enabled` |
| Navbar | `UserMenu` | Avatar + dropdown (Perfil/Configuración/Cerrar sesión) si hay sesión; botones Iniciar sesión/Registrarse si no |

## 7. Recuperación de contraseña — pendiente del backend

**El backend no expone ningún endpoint de recuperación de contraseña** (confirmado contra el
OpenAPI real: solo existen `register/login/logout/refresh/me/profile/settings`). Decisión tomada
con el usuario: construir la UI completa (`ForgotPasswordForm`, con su propio schema/validación) y,
al enviar, mostrar un `EmptyState` claro ("Todavía no disponible... pendiente del backend") en vez
de simular un éxito falso o inventar un endpoint.

**Para conectar cuando el backend lo exponga**: reemplazar el `setSubmitted(true)` en
`ForgotPasswordForm.onSubmit` por la llamada real (`forgotPasswordRequest(values.email)`) — el
formulario, la validación y el resto de la UI no necesitan cambios.

## 8. Bugs reales encontrados y corregidos

Verificación en navegador (no solo build) encontró y corrigió, además del hallazgo de infraestructura de la sección 9:

1. **El backend no arrancaba**: `POST /auth/logout` declaraba `status_code=204` con un modelo de
   respuesta, y FastAPI rechaza eso al iniciar (`AssertionError: Status code 204 must not have a
   response body`). Esto tumbaba **toda** la app (no solo Identity). Corregido en el backend
   agregando `response_model=None` al handler — fuera de mi alcance como agente de frontend, se
   coordinó con el usuario antes de tocar ese archivo.
2. **`DropdownMenuLabel` fuera de un `DropdownMenuGroup`**: Base UI (`@base-ui/react/menu`) exige
   que `Menu.GroupLabel` esté dentro de un `Menu.Group`/`Menu.RadioGroup` — usarlo suelto tira
   `Base UI: MenuGroupContext is missing`. Encontrado abriendo el menú de usuario real en el
   navegador (no aparece en ningún type-check). Corregido envolviendo cada sección de
   `UserMenu` en `DropdownMenuGroup`.
3. **`useSyncExternalStore` con snapshot de servidor inestable**: `useAuth()` pasaba
   `() => ({ status: 'loading', session: null })` como `getServerSnapshot` — un objeto **nuevo**
   en cada llamada, lo que React interpreta como "cambió" en cada render (warning real: *"The
   result of getServerSnapshot should be cached to avoid an infinite loop"*). Corregido con una
   constante module-level (`SERVER_SNAPSHOT`) devuelta siempre por referencia.

## 9. Advertencia de entorno: múltiples procesos del backend

Durante las pruebas en navegador se observó una actualización de perfil fallando con
`"No existe el usuario <id>"` justo después de haber registrado y logueado ese mismo usuario.
Se verificó con `curl` que un ciclo limpio register → login → `PATCH /profile` funciona
perfectamente (200, datos actualizados). La causa real: **había 3 procesos de uvicorn distintos
escuchando en el puerto 8000 al mismo tiempo** (`netstat` mostró 3 PIDs), cada uno con su propio
`InMemoryIdentityUnitOfWork` en memoria — una request podía crear el usuario en un proceso y otra
request (del mismo navegador) aterrizar en un proceso distinto que nunca vio ese usuario. Esto es
un artefacto del entorno de desarrollo (probablemente otra sesión con su propio backend corriendo
en paralelo), no un bug del frontend ni del backend. En un entorno con un único proceso backend
(o balanceo con estado compartido — Postgres, no memoria), esto no ocurre.

## 10. Limitaciones conocidas y próximos pasos

- **Cookies httpOnly en vez de `localStorage`**: eliminaría el riesgo de XSS sobre los tokens y
  habilitaría protección de rutas real en Next.js Middleware (server-side). Requiere que el
  backend devuelva `Set-Cookie` en vez de (o además de) el body — cambio de contrato, no solo de
  frontend.
- **Recuperación de contraseña**: UI lista, sin backend — ver sección 7.
- **Verificación de email** (`user.is_verified`): el campo ya viene en `User`, pero no hay flujo de
  verificación construido todavía (no estaba en el alcance de este sprint).
- **Favoritos e Historial**: explícitamente fuera de alcance de este sprint.
