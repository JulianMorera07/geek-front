/**
 * El `status`/`type` del anime es texto libre del backend (no un enum
 * cerrado) — puede haber valores no contemplados aquí según la fuente de
 * datos. Se mapean los conocidos y se usa un fallback legible para el resto,
 * en vez de asumir que la lista está completa.
 */
const STATUS_LABELS: Record<string, string> = {
  ongoing: 'En emisión',
  completed: 'Finalizado',
  upcoming: 'Próximamente',
  hiatus: 'En pausa',
  cancelled: 'Cancelado',
};

const STATUS_VARIANTS: Record<string, 'success' | 'secondary' | 'info' | 'warning'> = {
  ongoing: 'success',
  completed: 'secondary',
  upcoming: 'info',
  hiatus: 'warning',
  cancelled: 'warning',
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] ?? capitalize(status);
}

export function statusVariant(status: string): 'success' | 'secondary' | 'info' | 'warning' {
  return STATUS_VARIANTS[status.toLowerCase()] ?? 'secondary';
}
