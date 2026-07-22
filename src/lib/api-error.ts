/**
 * Shape de error consistente para toda la capa de datos (mock hoy, API real
 * después). Cualquier cliente/fetcher que falle debe lanzar `ApiError`, nunca
 * un `Error` genérico ni un string — así los componentes de UI (`ErrorView`)
 * pueden mostrar mensajes específicos por código sin acoplarse al origen.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

export function isNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
}

/**
 * 401 y 403 significan lo mismo en este backend: no autenticado (token
 * ausente/inválido/expirado). `HTTPBearer(auto_error=True)` devuelve 403
 * cuando falta el header y 401 cuando el token decodifica pero es inválido
 * — el cliente los trata igual (intentar refresh, si no, ir a login).
 */
export function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function isConflictError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409;
}
