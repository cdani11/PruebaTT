<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Controllers;

use PruebaTT\ClientesPedidos\Application\Pedido\PedidoAppService;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;
use PruebaTT\ClientesPedidos\Presentation\Http\Respuesta;

final class PedidoController
{
    public function __construct(private PedidoAppService $servicio) {}

    public function crear(array $_args, array $cuerpo, array $_query): void
    {
        $pedido = $this->servicio->crearPedido(
            clienteId: $cuerpo['clienteId'] ?? '',
            detalles: $cuerpo['detalles'] ?? []
        );
        Respuesta::exito($this->serializar($pedido), 201);
    }

    public function cancelar(array $args, array $_cuerpo, array $_query): void
    {
        $pedido = $this->servicio->cancelarPedido($args['id']);
        Respuesta::exito($this->serializar($pedido));
    }

    public function listar(array $_args, array $_cuerpo, array $query): void
    {
        $pedidos = array_map(
            fn(Pedido $p) => $this->serializar($p),
            $this->servicio->listarPedidos((int)($query['pagina'] ?? 1), (int)($query['tamanio'] ?? 20))
        );
        Respuesta::exito($pedidos);
    }

    private function serializar(Pedido $p): array
    {
        return [
            'id' => $p->id(),
            'clienteId' => $p->clienteId(),
            'fechaCreacion' => $p->fechaCreacion()->format(DATE_ATOM),
            'estado' => $p->estado()->value,
            'total' => $p->total(),
            'detalles' => array_map(fn($d) => [
                'producto' => $d->producto(),
                'cantidad' => $d->cantidad(),
                'precioUnitario' => $d->precioUnitario(),
                'subtotal' => $d->subtotal(),
            ], $p->detalles()),
        ];
    }
}
