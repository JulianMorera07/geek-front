# GeekBaku Frontend — Arquitectura

> Documento de diseño. No contiene implementación. Deriva de las reglas fijadas en `CLAUDE.md`: Next.js + React + TypeScript + TailwindCSS + shadcn/ui + Framer Motion, interfaz premium de inspiración anime, dark-first, responsive, accesible, rápida, minimal, elegante. Solo UI/cliente — sin lógica de backend, solo consumo de APIs documentadas.

## 1. Sistema de diseño

### 1.1 Fundamentos
- **Base**: Tailwind como motor de utilidades + shadcn/ui como capa de componentes accesibles (Radix primitives) sobre la cual se aplica el skin visual del producto. No se usan estilos inline (regla de CLAUDE.md); toda variación vive en clases Tailwind o en `class-variance-authority` (cva) para variantes de componente.
- **Tokens**: definidos como variables CSS en `:root` / `.dark` (Tailwind v4 `@theme` o `tailwind.config` en v3) y consumidos vía utilidades semánticas (`bg-background`, `text-foreground`, `border-border`, etc.), nunca colores hardcodeados en componentes.
- **Escalas**:
  - Color: escala neutra (grises fríos casi-negros para dark-first) + 1 acento primario + 1 acento secundario "energía" (para CTAs, estados activos, highlights de estilo anime) + semánticos (success/warning/danger/info).
  - Tipografía: una fuente display (para títulos, con carácter, ligeramente condensada/geométrica) + una fuente de texto (alta legibilidad). Escala modular (xs→5xl) ya provista por Tailwind, restringida a un subconjunto documentado (evitar tamaños arbitrarios).
  - Espaciado: escala base-4 de Tailwind, sin valores arbitrarios (`p-[13px]`) salvo excepción justificada.
  - Radios y sombras: radio base consistente (ej. `rounded-xl` como default de tarjetas/inputs), sombras suaves + "glow" sutil de acento para elementos interactivos destacados (coherente con estética anime/neon discreta, sin saturar).
- **Componentes shadcn/ui**: se instalan bajo demanda (`button`, `input`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `tooltip`, `toast/sonner`, `skeleton`, `avatar`, `card`, `badge`, `form`). Se envuelven en `components/ui` sin modificar el core generado, y cualquier personalización de marca se hace en una capa `components/base` que compone sobre `ui`.
- **Motion**: Framer Motion se reserva para transiciones de página, entrada/salida de modales/drawers, micro-interacciones de hover/tap en tarjetas y estados de carga. Se define un set reducido de variantes reutilizables (`fadeIn`, `slideUp`, `scaleIn`, `staggerChildren`) en `lib/motion.ts` para evitar reinventar curvas de animación por componente. Se respeta `prefers-reduced-motion`.
- **Iconografía**: un único set consistente (lucide-react, ya integrado con shadcn/ui) para evitar mezclar estilos de ícono.

### 1.2 Documentación viva
- El sistema de diseño se documenta y valida en una ruta de desarrollo tipo `/dev/design-system` (o Storybook si se añade más adelante) que renderiza tokens, tipografía, botones, estados, para revisión visual rápida sin tocar código de producto.

## 2. Navegación

### 2.1 Estructura de rutas (Next.js App Router)
- `app/(marketing)/…` — páginas públicas (landing, precios, about) con layout propio, más ligero, orientado a conversión.
- `app/(app)/…` — producto autenticado, con shell persistente (sidebar/topbar), protegido por middleware de sesión (la validación de sesión en sí es responsabilidad del backend/API; el frontend solo reacciona al estado de auth expuesto por la API).
- `app/(auth)/…` — login/registro/recuperación, layout minimalista centrado.
- Grupos de rutas (`(marketing)`, `(app)`, `(auth)`) permiten layouts y metadata independientes sin afectar la URL.

### 2.2 Patrón de navegación por dispositivo
- **Mobile-first**: navegación inferior (tab bar) o drawer lateral (`Sheet` de shadcn) accionado por ícono de menú; nunca sidebar fijo en viewport pequeño.
- **Desktop**: sidebar colapsable persistente + topbar con breadcrumbs, búsqueda y acciones de usuario.
- **Breadcrumbs**: generados a partir del árbol de rutas para vistas profundas (>2 niveles).
- **Estados de navegación**: activo/hover/foco claramente diferenciados (ring de acento), accesibles por teclado (skip-links, `aria-current="page"`).

### 2.3 Transiciones
- Transiciones de página con Framer Motion (`AnimatePresence` a nivel de layout) sutiles (fade + slight translate), nunca bloqueantes ni superiores a ~250ms para no penalizar percepción de velocidad.

## 3. Organización de componentes

Organización **feature-based** (regla explícita de CLAUDE.md), con una capa compartida mínima.

```
src/
  app/                     # rutas Next.js (App Router), solo composición de página
  features/
    <feature>/
      components/          # componentes exclusivos de la feature
      hooks/                # hooks de la feature (data + UI state)
      api/                  # llamadas/clients específicos de la feature
      schemas/              # validación (zod) de formularios/respuestas
      types.ts
      index.ts              # barrel export controlado
  components/
    ui/                     # primitives shadcn/ui (generados, casi sin edición)
    base/                   # composición de marca sobre ui/ (Button con variantes propias, etc.)
    layout/                 # Shell, Sidebar, Topbar, PageHeader, EmptyState
  lib/
    api-client.ts           # cliente HTTP central (fetch wrapper, interceptores)
    motion.ts                # variantes Framer Motion reutilizables
    utils.ts                 # cn(), formatters, helpers puros
  hooks/                    # hooks genéricos no atados a una feature
  stores/                   # estado global (client state) por dominio
  styles/                   # globals.css, tokens
```

### Reglas de dependencia
- `features/*` puede importar de `components/`, `lib/`, `hooks/`, `stores/`.
- `components/` y `lib/` **nunca** importan de `features/*` (evita acoplamiento inverso).
- Una feature no importa directamente de otra feature; si se necesita compartir algo, se promueve a `components/` o `lib/`.
- Componentes reutilizables (regla de CLAUDE.md) nacen dentro de la feature; solo se "gradúan" a `components/base` cuando un segundo consumidor real lo necesita (evita abstracción prematura).

## 4. Gestión de estado

Se distinguen explícitamente 4 categorías de estado, cada una con su herramienta:

| Tipo de estado | Herramienta | Ejemplo |
|---|---|---|
| Server state (datos de la API) | TanStack Query (React Query) | listados, detalle de recurso, mutaciones |
| Client/UI state global | Zustand (store ligero por dominio en `stores/`) | tema, sidebar abierto/cerrado, modal activo, filtros persistentes de UI |
| Estado de formularios | React Hook Form + Zod | cualquier formulario de la app |
| Estado local de componente | `useState`/`useReducer` | toggles, hover, paso de un wizard puntual |

- **No** se usa Redux ni un store monolítico: server state vive en React Query (cache, revalidación, reintentos, invalidación) y solo el estado genuinamente de cliente vive en Zustand, para no duplicar la fuente de verdad (evita bugs de sincronización caché-API vs store manual).
- Cada store de Zustand es pequeño y con scope de dominio (`useUiStore`, `useThemePrefsStore`), no un store único "global".
- Los formularios usan `zodResolver` con el mismo schema Zod que valida la respuesta esperada de la API cuando aplica, para mantener un único contrato de forma de datos.

## 5. Integración con la API

- **Regla dura de CLAUDE.md**: el frontend solo consume APIs de backend ya documentadas; nunca implementa lógica de negocio ni reglas de dominio en el cliente.
- **Cliente HTTP único** (`lib/api-client.ts`): wrapper sobre `fetch` con base URL desde variable de entorno, manejo central de headers/auth token, parsing de errores en un shape consistente (`ApiError`), y timeout.
- **Capa por feature** (`features/<feature>/api/`): funciones tipadas que llaman al cliente central y devuelven datos ya parseados/validados con Zod (fail-fast si la API responde algo fuera de contrato).
- **React Query** encapsula cada llamada en hooks (`useOrders()`, `useCreateOrder()`), centralizando keys de caché (`queryKeys.ts` por feature) e invalidaciones tras mutaciones.
- **Contratos de tipos**: si el backend expone OpenAPI/Swagger, se generan tipos (`openapi-typescript` o similar) como fuente de verdad, evitando tipos manuales divergentes; si no, los tipos se definen a mano junto al schema Zod correspondiente y se marcan como "por confirmar contra backend".
- **Errores y loading**: todo hook de datos expone `isLoading`, `isError`, `error` de forma consistente; los componentes de feature son responsables de renderizar skeleton/empty/error state (regla de CLAUDE.md: loading y error states en todas partes), nunca dejar una sección en blanco silenciosamente.

## 6. Tema visual

- **Dark-first**: el tema oscuro es el diseño primario y de referencia; el modo claro (si se ofrece) se deriva de los mismos tokens invertidos, no se diseña por separado desde cero.
- **Paleta**: base casi-negra con varios niveles de superficie (fondo app < superficie de tarjeta < superficie elevada/modal) para dar profundidad sin recurrir solo a sombras. Acento primario vibrante (tono a definir con marca, ej. violeta/cian eléctrico típico de estética anime moderna) usado con moderación — reservado a acciones primarias, focos y highlights, no como color de fondo extendido.
- **Estética "anime premium"**: se traduce en detalles de acabado, no en literalidad temática — gradientes sutiles tipo "glow", bordes finos con leve luminiscencia en estados activos/focus, tipografía display con carácter, micro-animaciones con timing ágil (ease-out rápido), y uso cuidado de espacio negativo para sensación "premium" y no recargada.
- **Modo claro**: mismos tokens semánticos invertidos; se valida contraste (WCAG AA mínimo) en ambos modos antes de aceptar cualquier combinación de color.
- **Theming técnico**: `next-themes` para persistencia y sincronización de preferencia de sistema/usuario, sin flash de tema incorrecto (script de hidratación temprana).

## 7. Guía de UX

### Principios (derivados de CLAUDE.md: dark-first, responsive, accesible, rápida, minimal, elegante)
1. **Mobile-first siempre**: cada pantalla se diseña primero para viewport pequeño; desktop es una expansión, no el caso base.
2. **Feedback inmediato**: toda acción async (submit, fetch, mutación) tiene estado de carga visible (skeleton/spinner) en <100ms percibidos, y confirmación clara de éxito (toast) o error (mensaje inline + toast).
3. **Nunca una pantalla vacía sin explicar por qué**: todo listado/estado tiene su `EmptyState` diseñado (no solo "no data").
4. **Accesibilidad no negociable**: navegación completa por teclado, foco visible, roles/aria correctos (heredados de Radix vía shadcn/ui), contraste AA, tamaños táctiles ≥44px en mobile, `prefers-reduced-motion` respetado.
5. **Minimalismo con jerarquía clara**: una acción primaria por vista; el resto se degrada visualmente (secondary/ghost). Se evita la sobrecarga de elementos "premium" (glow, motion) — se reservan para momentos de alto impacto (onboarding, confirmaciones, hitos), no de forma constante.
6. **Rendimiento como parte del UX**: uso de Server Components por defecto en Next.js, Client Components solo donde hay interactividad real; imágenes con `next/image`; code-splitting por feature/ruta; animaciones que no bloqueen el hilo principal (transform/opacity únicamente).
7. **Consistencia sobre creatividad puntual**: cualquier patrón nuevo (nuevo tipo de card, nuevo layout) se evalúa primero contra el sistema de diseño existente antes de crear uno nuevo.

### Flujo de trabajo por feature (regla de CLAUDE.md)
1. Diseñar UX (flujo, estados, wireframe mental o boceto).
2. Diseñar componentes (qué existe ya en `components/`, qué nace en la feature).
3. Implementar (feature-based, sin lógica de backend).
4. Probar (estados loading/error/empty, accesibilidad, responsive).
5. Optimizar (performance, animaciones, bundle).

## 8. Resumen de decisiones clave

| Decisión | Elección |
|---|---|
| Routing | Next.js App Router, grupos de rutas por contexto (marketing/app/auth) |
| Componentes UI | shadcn/ui + capa `base/` de marca, sin edición directa de `ui/` |
| Organización | Feature-based, capa compartida mínima (`components`, `lib`, `hooks`, `stores`) |
| Server state | TanStack Query |
| Client state | Zustand, stores pequeños por dominio |
| Formularios | React Hook Form + Zod |
| Animación | Framer Motion, variantes centralizadas, respeta reduced-motion |
| Tema | next-themes, dark-first, tokens semánticos compartidos entre modos |
| API | Cliente HTTP único + capa por feature, tipado por Zod/OpenAPI |

---
*Este documento es de arquitectura/diseño únicamente. No se ha escrito código de implementación.*
