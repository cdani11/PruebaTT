export interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono: string | null;
  fechaRegistro: string;
  activo: boolean;
}

export interface CrearClienteDto {
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono?: string;
}

export interface ActualizarClienteDto {
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono?: string;
}
