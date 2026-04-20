export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'ENTREGADO';

export interface DetallePedido {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  fechaCreacion: string;
  estado: EstadoPedido;
  total: number;
  detalles: DetallePedido[];
}

export interface DetallePedidoDto {
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearPedidoDto {
  clienteId: string;
  detalles: DetallePedidoDto[];
}
