/**
 * Registro curado de iconos (lucide-react) usados en el producto.
 *
 * Regla: importar íconos desde este archivo en vez de `lucide-react`
 * directamente en features/páginas. Mantiene un set consistente y hace
 * explícito qué íconos son "vocabulario oficial" del producto — cualquier
 * ícono nuevo se agrega aquí primero, con su propósito documentado.
 *
 * Excepción: componentes de `components/ui` (generados por shadcn) importan
 * lucide-react directamente, ya que son primitives de terceros.
 */
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CogIcon,
  HomeIcon,
  InfoIcon,
  LayoutDashboardIcon,
  LoaderIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  TrashIcon,
  TriangleAlertIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

export const Icons = {
  notification: BellIcon,
  calendar: CalendarIcon,
  check: CheckIcon,
  chevronDown: ChevronDownIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  danger: CircleAlertIcon,
  success: CircleCheckIcon,
  settings: CogIcon,
  home: HomeIcon,
  info: InfoIcon,
  dashboard: LayoutDashboardIcon,
  spinner: LoaderIcon,
  logout: LogOutIcon,
  menu: MenuIcon,
  moon: MoonIcon,
  add: PlusIcon,
  search: SearchIcon,
  sun: SunIcon,
  delete: TrashIcon,
  warning: TriangleAlertIcon,
  user: UserIcon,
  close: XIcon,
} as const;

export type IconName = keyof typeof Icons;
