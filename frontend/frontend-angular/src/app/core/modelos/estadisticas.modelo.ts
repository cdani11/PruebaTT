export interface ResumenEstadisticas {
  totalPedidos: number;
  completados: number;
  pendientesYConfirmados: number;
  cancelados: number;
  totalClientes: number;
}

export interface PuntoDiario {
  fecha: string;
  pedidos: number;
  mediaMovil7d: number;
}

export interface PuntoMensual {
  mes: string;
  pedidos: number;
}

export interface Estadisticas {
  resumen: ResumenEstadisticas;
  actividadDiaria: PuntoDiario[];
  actividadMensual: PuntoMensual[];
}
