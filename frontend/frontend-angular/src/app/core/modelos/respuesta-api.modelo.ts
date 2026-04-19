export interface RespuestaApi<T> {
  exito: boolean;
  datos: T | null;
  errores: string[];
}
