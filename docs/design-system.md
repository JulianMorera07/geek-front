# GeekBaku — Design System

Sprint 2. Documentación del sistema de diseño construido sobre Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui (estilo `base-nova`, primitives [Base UI](https://base-ui.com), no Radix) + Framer Motion.

> Ninguna página de producto se implementó en este sprint. Todo lo de aquí son bloques reutilizables en `src/components/` y tokens en `src/app/globals.css`.

## Índice

1. [Sistema de colores](#1-sistema-de-colores)
2. [Tipografía](#2-tipografía)
3. [Espaciado](#3-espaciado)
4. [Iconografía](#4-iconografía)
5. [Botones](#5-botones)
6. [Cards](#6-cards)
7. [Badges](#7-badges)
8. [Navbar](#8-navbar)
9. [Sidebar](#9-sidebar)
10. [Footer](#10-footer)
11. [Skeletons](#11-skeletons)
12. [Dialogs](#12-dialogs)
13. [Loading](#13-loading)
14. [Toast](#14-toast)
15. [Inputs](#15-inputs)
16. [Search Components](#16-search-components)
17. [Convenciones y reglas de reutilización](#17-convenciones-y-reglas-de-reutilización)

---

## 1. Sistema de colores

Fuente de verdad: `src/app/globals.css`. Todos los colores son variables CSS en `oklch()`, definidas en `:root` (light) y `.dark`, y expuestas como utilidades Tailwind vía el bloque `@theme inline` (`bg-primary`, `text-muted-foreground`, `border-border`, etc.). **Nunca** usar valores hex/rgb sueltos en componentes — siempre el token semántico.

### Tokens estructurales (shadcn)

| Token | Uso |
|---|---|
| `background` / `foreground` | Fondo y texto base de la app |
| `card` / `card-foreground` | Superficie de tarjetas |
| `popover` / `popover-foreground` | Dropdowns, dialogs, tooltips, command palette |
| `primary` / `primary-foreground` | Acción principal por defecto (escala neutra) |
| `secondary` / `secondary-foreground` | Acción secundaria |
| `muted` / `muted-foreground` | Texto/fondos de baja énfasis |
| `accent` / `accent-foreground` | Superficies de hover/estado activo (no confundir con `brand`) |
| `destructive` | Acciones irreversibles (eliminar, revocar) |
| `border` / `input` / `ring` | Bordes, contornos de input, anillo de foco |

### Tokens de marca y semánticos (añadidos en este sprint)

| Token | Uso |
|---|---|
| `brand` / `brand-foreground` | Acento vibrante de marca — CTAs destacados, highlights "premium". Uso moderado, nunca como fondo extendido |
| `success` / `success-foreground` | Confirmaciones, estados completados |
| `warning` / `warning-foreground` | Advertencias, estados en riesgo |
| `info` / `info-foreground` | Mensajes informativos neutros |

Cada uno tiene su propio valor en light y dark — nunca se calculan por opacidad de otro token.

### Uso

```tsx
<div className="bg-background text-foreground">
<Button variant="brand">Acción destacada</Button>
<Badge variant="success">Activo</Badge>
```

### Dark-first

`ThemeProvider` (`src/components/theme-provider.tsx`, envuelto en `src/app/layout.tsx`) usa `next-themes` con `defaultTheme="dark"` y `enableSystem`. El toggle está en `src/components/base/theme-toggle.tsx` (`<ThemeToggle />`).

---

## 2. Tipografía

Dos familias, cargadas vía `next/font/google` en `src/app/layout.tsx`:

| Variable CSS | Fuente | Uso |
|---|---|---|
| `--font-sans` | Geist Sans | Texto de cuerpo, UI general |
| `--font-heading` | Sora | Títulos únicamente (`font-heading`) — más geométrica, da el carácter "premium" |
| `--font-mono` | Geist Mono | Código, valores técnicos |

### Componente: `Heading` / `Text`

`src/components/base/typography.tsx`

```tsx
import { Heading, Text } from "@/components/base/typography";

<Heading level="h1">Título de página</Heading>
<Heading level="h3" as="h2">Subtítulo (h2 semántico, tamaño h3)</Heading>

<Text>Párrafo de cuerpo por defecto.</Text>
<Text variant="lead">Texto introductorio más grande.</Text>
<Text variant="muted">Texto secundario.</Text>
<Text variant="small">Texto auxiliar / captions.</Text>
```

| Prop | Valores | Notas |
|---|---|---|
| `Heading.level` | `h1` \| `h2` \| `h3` \| `h4` | Define tamaño. Por defecto también define el tag HTML |
| `Heading.as` | `h1`–`h4` | Sobrescribe el tag HTML sin cambiar el tamaño (accesibilidad: mantener jerarquía correcta) |
| `Text.variant` | `body` \| `lead` \| `muted` \| `small` | |
| `Text.as` | `p` \| `span` \| `div` | |

**Regla**: `font-heading` solo en `Heading`/títulos de `Card`/`Dialog`. Nunca en párrafos largos (Sora pierde legibilidad en texto extenso).

---

## 3. Espaciado

Se usa la escala nativa de Tailwind (base 4px: `1` = 0.25rem) sin valores arbitrarios (`p-[13px]`) salvo excepción justificada y documentada inline.

### Componente: `Container`

`src/components/layout/container.tsx` — centraliza el ancho máximo y el padding horizontal responsive (mobile-first) para que ninguna sección reinvente sus márgenes.

```tsx
import { Container } from "@/components/layout/container";

<Container>{/* contenido a max-w-7xl */}</Container>
<Container size="narrow">{/* max-w-3xl, ej. formularios/artículos */}</Container>
<Container size="full">{/* sin max-width */}</Container>
```

| `size` | max-width |
|---|---|
| `default` | `max-w-7xl` |
| `narrow` | `max-w-3xl` |
| `full` | ninguno |

Padding horizontal interno: `px-4` (mobile) → `sm:px-6` → `lg:px-8`. Espaciado vertical entre secciones: usar múltiplos de `4`/`6`/`8`/`12`/`16` (`py-12`, `gap-6`, etc.), evitando mezclar escalas arbitrarias en una misma página.

---

## 4. Iconografía

Set único: [lucide-react](https://lucide.dev) (ya integrado como `iconLibrary` de shadcn/ui).

### Registro curado: `src/lib/icons.ts`

```tsx
import { Icons } from "@/lib/icons";

const Icon = Icons.search;
<Icon className="size-4" />
```

**Regla**: features/páginas importan íconos desde `@/lib/icons`, no directo de `lucide-react`. Si un ícono nuevo hace falta, se agrega primero al registro (con su nombre semántico), no se importa ad-hoc — evita duplicar el mismo concepto con dos íconos distintos en la app.

Excepción: los componentes de `components/ui/*` (generados por shadcn) importan `lucide-react` directamente — son primitives de terceros, no código de producto.

Tamaño por defecto: `size-4` (16px) inline con texto, `size-5`/`size-8` en botones icon-only o estados vacíos/carga.

---

## 5. Botones

`src/components/ui/button.tsx` — `Button`, `buttonVariants` (cva).

```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="brand">Brand</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="link">Link</Button>

<Button size="sm">Small</Button>
<Button size="icon" aria-label="Config"><Icons.settings /></Button>
```

| Prop | Valores |
|---|---|
| `variant` | `default` · `brand` · `outline` · `secondary` · `ghost` · `destructive` · `success` · `warning` · `link` |
| `size` | `xs` · `sm` · `default` · `lg` · `icon-xs` · `icon-sm` · `icon` · `icon-lg` |

### Renderizar como otro elemento (Base UI usa `render`, no `asChild`)

```tsx
import Link from "next/link";

<Button render={<Link href="/dashboard" />}>Ir al dashboard</Button>
```

Estados `disabled`, `focus-visible` (ring de foco) y `aria-invalid` ya vienen resueltos por la variante base. Botones icon-only **siempre** requieren `aria-label`.

---

## 6. Cards

`src/components/ui/card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

```tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

<Card>
  <CardHeader>
    <CardTitle>Plan Pro</CardTitle>
    <CardDescription>Facturación mensual</CardDescription>
    <CardAction>
      <Button size="sm" variant="outline">Editar</Button>
    </CardAction>
  </CardHeader>
  <CardContent>{/* contenido */}</CardContent>
  <CardFooter>
    <Button className="w-full">Continuar</Button>
  </CardFooter>
</Card>
```

`size="sm"` en `Card` reduce el padding interno (`--card-spacing`) para tarjetas densas/compactas (ej. dentro de listas). `CardFooter` incluye automáticamente separador y fondo `muted/50`.

---

## 7. Badges

`src/components/ui/badge.tsx` — `Badge`, `badgeVariants`.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="brand">Nuevo</Badge>
<Badge variant="secondary">Beta</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="destructive">Vencido</Badge>
```

| `variant` | Semántica |
|---|---|
| `default` / `secondary` / `outline` / `ghost` | Neutro / estructural |
| `brand` | Destacado de marca (ej. "Nuevo") |
| `success` / `warning` / `info` / `destructive` | Estado del dato (nunca decorativo) |

---

## 8. Navbar

`src/components/layout/navbar.tsx` — `Navbar`.

Reutilizable tanto para el layout **marketing** (con enlaces + Sheet mobile) como para el **shell de app** (con `leadingSlot` = `SidebarTrigger`).

```tsx
import { Navbar } from "@/components/layout/navbar";

// Marketing
<Navbar
  logo={<span>GeekBaku</span>}
  links={[{ label: "Producto", href: "/producto" }, { label: "Precios", href: "/precios" }]}
  onSearchClick={() => setCommandOpen(true)}
  actions={<Button size="sm">Iniciar sesión</Button>}
/>

// Shell de app (con sidebar)
import { SidebarTrigger } from "@/components/layout/app-sidebar";

<Navbar
  logo={<span>GeekBaku</span>}
  leadingSlot={<SidebarTrigger />}
  onSearchClick={() => setCommandOpen(true)}
  actions={<UserMenuDropdown />}
/>
```

Incluye: toggle de tema (`ThemeToggle`), botón de búsqueda (abre `SearchCommand` vía `onSearchClick`, con atajo `⌘K` visible), y menú mobile en `Sheet` cuando hay `links`. Sticky con blur (`backdrop-blur-sm`) sobre `bg-background/80`.

---

## 9. Sidebar

Primitivos generados por shadcn en `src/components/ui/sidebar.tsx` (colapsa a modo ícono en desktop, a `Sheet` en mobile — atajo `⌘/Ctrl+B`). Composición lista para usar: `src/components/layout/app-sidebar.tsx`.

```tsx
import {
  AppSidebar,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/layout/app-sidebar";
import { Icons } from "@/lib/icons";

<SidebarProvider>
  <AppSidebar
    header={<span className="font-heading font-semibold">GeekBaku</span>}
    groups={[
      {
        label: "General",
        items: [
          { title: "Dashboard", url: "/dashboard", icon: Icons.dashboard, isActive: true },
          { title: "Ajustes", url: "/settings", icon: Icons.settings },
        ],
      },
    ]}
  />
  <SidebarInset>
    {/* Navbar + contenido de la página */}
  </SidebarInset>
</SidebarProvider>
```

| Prop de `AppSidebar` | Tipo |
|---|---|
| `groups` | `{ label?: string; items: { title, url, icon?, isActive?, badge? }[] }[]` |
| `header` / `footer` | `ReactNode` (ej. logo / menú de usuario) |

`SidebarProvider` debe envolver **todo el shell de app** (persiste el estado abierto/cerrado en cookie). `SidebarTrigger` va en el `Navbar` vía `leadingSlot`.

---

## 10. Footer

`src/components/layout/footer.tsx` — `Footer`. Solo para el layout marketing.

```tsx
import { Footer } from "@/components/layout/footer";

<Footer
  logo={<span>GeekBaku</span>}
  description="Plataforma anime-first para creadores."
  columns={[
    { title: "Producto", links: [{ label: "Precios", href: "/precios" }] },
    { title: "Legal", links: [{ label: "Términos", href: "/terminos" }] },
  ]}
/>
```

`copyright` es opcional (por defecto genera `© {año actual} GeekBaku…`). Columnas y contenido son 100% props — nada hardcodeado.

---

## 11. Skeletons

`src/components/ui/skeleton.tsx` — `Skeleton`. También existe `SidebarMenuSkeleton` (dentro de `ui/sidebar.tsx`) para loading state de ítems de navegación.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-3 w-24" />
  </div>
</div>
```

**Regla (CLAUDE.md — loading/error states everywhere)**: cualquier sección que dependa de datos remotos debe tener su versión `Skeleton` con las mismas dimensiones aproximadas del contenido final, para evitar layout shift al resolver.

---

## 12. Dialogs

`src/components/ui/dialog.tsx` — primitives (`Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`).

```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Abrir</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción breve de la acción.</DialogDescription>
    </DialogHeader>
    <DialogFooter showCloseButton>
      <Button>Guardar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Composición: `ConfirmDialog`

`src/components/base/confirm-dialog.tsx` — para confirmaciones destructivas, controlado por estado externo (no maneja lógica de negocio; `onConfirm` la dispara el consumidor).

```tsx
import { ConfirmDialog } from "@/components/base/confirm-dialog";

const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  variant="destructive"
  title="¿Eliminar este elemento?"
  description="Esta acción no se puede deshacer."
  confirmLabel="Eliminar"
  loading={isPending}
  onConfirm={() => mutate()}
/>
```

---

## 13. Loading

`src/components/base/loading.tsx` — tres niveles según el alcance del loading:

| Componente | Uso |
|---|---|
| `Spinner` | Atómico — dentro de un `Button`, junto a un texto, inline |
| `SectionLoader` | Reemplaza el contenido de una card/sección mientras carga |
| `PageLoader` | Overlay fixed a pantalla completa — solo transiciones de página o acciones bloqueantes explícitas |

```tsx
import { Spinner, SectionLoader, PageLoader } from "@/components/base/loading";

<Button disabled={isPending}>{isPending && <Spinner size="sm" />} Guardar</Button>

<SectionLoader label="Cargando pedidos…" />

{isNavigating && <PageLoader label="Cargando…" />}
```

**Regla**: para listas/grillas de datos, preferir `Skeleton` (arriba) sobre `SectionLoader`/`Spinner` — el skeleton comunica mejor la forma del contenido que llega.

---

## 14. Toast

`src/components/ui/sonner.tsx` — `Toaster`, ya montado globalmente en `src/app/layout.tsx` (`<Toaster position="top-right" />`). Los toasts se disparan con la función `toast` de la librería `sonner` (no un componente):

```tsx
import { toast } from "sonner";

toast.success("Cambios guardados");
toast.error("No se pudo completar la acción");
toast.warning("Revisa los campos marcados");
toast.info("Sincronización en curso…");
toast("Mensaje neutro");

toast.promise(mutateAsync(), {
  loading: "Guardando…",
  success: "Guardado",
  error: "Error al guardar",
});
```

Iconografía (success/info/warning/error/loading) y colores ya están mapeados a los tokens del tema (`--popover`, `--border`) y reaccionan automáticamente al tema activo (`next-themes`).

---

## 15. Inputs

`src/components/ui/input.tsx`, `textarea.tsx`, `label.tsx`, `input-group.tsx`.

```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton,
} from "@/components/ui/input-group";
import { Icons } from "@/lib/icons";

<div className="grid gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="tú@ejemplo.com" />
</div>

<Textarea placeholder="Escribe un mensaje…" />

{/* Input con ícono/acción embebida */}
<InputGroup>
  <InputGroupAddon><Icons.user /></InputGroupAddon>
  <InputGroupInput placeholder="Usuario" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs"><Icons.close /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

Estados de error: `aria-invalid="true"` en el input activa automáticamente el estilo de error (borde/ring `destructive`) — no se necesita una prop custom. La integración con formularios (React Hook Form + Zod, ver `docs/frontend-architecture.md`) se implementa en el sprint de features, no aquí.

---

## 16. Search Components

Dos variantes, según el caso de uso:

### `SearchInput` — inline

`src/components/base/search-input.tsx`. Para filtros de lista/tabla dentro de una página.

```tsx
import { SearchInput } from "@/components/base/search-input";

const [query, setQuery] = useState("");

<SearchInput value={query} onChange={setQuery} placeholder="Buscar productos…" />
```

No hace fetch ni debounce por sí mismo — es solo el control de UI; esa lógica vive en el hook de la feature (React Query) que lo consuma.

### `SearchCommand` — paleta global (⌘K)

`src/components/base/search-command.tsx`. Se monta una vez en el shell de la app; su estado `open` vive en el store de UI (Zustand, ver arquitectura) o en un `useState` local mientras no exista ese store.

```tsx
import { useState } from "react";
import { SearchCommand, useCommandShortcut } from "@/components/base/search-command";
import { Icons } from "@/lib/icons";

function AppShell() {
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen(true));

  return (
    <SearchCommand
      open={open}
      onOpenChange={setOpen}
      groups={[
        {
          heading: "Navegación",
          items: [
            { value: "dashboard", label: "Dashboard", icon: <Icons.dashboard />, onSelect: () => router.push("/dashboard") },
          ],
        },
      ]}
    />
  );
}
```

`groups` son estáticos (navegación/acciones) o resultados ya resueltos por la feature — el componente no llama a ninguna API.

---

## 17. Convenciones y reglas de reutilización

- **`components/ui/`**: primitives generados por shadcn/ui (Base UI). Se extendieron `button.tsx` y `badge.tsx` con las variantes semánticas del punto 1 (`brand`, `success`, `warning`, `info`) — es la única edición intencional sobre archivos generados, porque las variantes de `cva` deben vivir en un solo lugar. El resto no se modifica a mano.
- **`components/base/`**: composición de marca reutilizable sobre `ui/` (tipografía, loading, theme-toggle, dialogs y search compuestos). No conoce features específicas.
- **`components/layout/`**: shells de página (Navbar, Sidebar, Footer, Container) — reciben contenido vía props/slots, nunca hardcodean copy de producto.
- **`lib/icons.ts`**: único punto de entrada para iconografía en código de producto.
- **Base UI vs Radix**: los primitives (`Dialog`, `Sheet`, `Tooltip`, `Command`, `Button`, `Sidebar`, …) usan [`@base-ui/react`](https://base-ui.com), no Radix. La composición de "renderizar como otro elemento" se hace con la prop **`render`** (`<Button render={<Link href="…" />}>`), no `asChild`.
- **Sin páginas ni lógica de negocio**: todo lo documentado aquí es UI pura y reutilizable; no hay fetch de datos, stores de dominio ni rutas de producto en este sprint.
