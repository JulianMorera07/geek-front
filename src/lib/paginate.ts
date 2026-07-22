export interface PaginatedSlice<T> {
  items: T[];
  page: number;
  pageCount: number;
}

/** Pagina un array ya completamente cargado en memoria (sin ida y vuelta a la API). */
export function paginateArray<T>(list: T[], page: number, pageSize: number): PaginatedSlice<T> {
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return { items: list.slice(start, start + pageSize), page: safePage, pageCount };
}
