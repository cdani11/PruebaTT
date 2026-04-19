<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Pedido;

enum EstadoPedido: string
{
    case Pendiente = 'PENDIENTE';
    case Confirmado = 'CONFIRMADO';
    case Entregado = 'ENTREGADO';
    case Cancelado = 'CANCELADO';
}
