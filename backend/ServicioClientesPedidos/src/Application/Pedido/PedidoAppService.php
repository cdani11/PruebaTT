<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Application\Pedido;

use PruebaTT\ClientesPedidos\Domain\Cliente\IClienteRepository;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;
use PruebaTT\ClientesPedidos\Domain\Pedido\IPedidoRepository;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;

final class PedidoAppService
{
    public function __construct(
        private IPedidoRepository $pedidos,
        private IClienteRepository $clientes
    ) {}

    public function crearPedido(string $clienteId, array $detalles): Pedido
    {
        if ($this->clientes->obtenerPorId($clienteId) === null) {
            throw new DominioExcepcion('Cliente no encontrado.');
        }
        $pedido = Pedido::crear($clienteId);
        foreach ($detalles as $d) {
            $pedido->agregarDetalle(
                producto: $d['producto'] ?? '',
                cantidad: (int)($d['cantidad'] ?? 0),
                precioUnitario: (float)($d['precioUnitario'] ?? 0)
            );
        }
        $pedido->confirmar();
        $this->pedidos->agregar($pedido);
        return $pedido;
    }

    public function cancelarPedido(string $id): Pedido
    {
        $pedido = $this->pedidos->obtenerPorId($id)
            ?? throw new DominioExcepcion('Pedido no encontrado.');
        $pedido->cancelar();
        $this->pedidos->actualizar($pedido);
        return $pedido;
    }

    public function completarPedido(string $id): Pedido
    {
        $pedido = $this->pedidos->obtenerPorId($id)
            ?? throw new DominioExcepcion('Pedido no encontrado.');
        $pedido->completar();
        $this->pedidos->actualizar($pedido);
        return $pedido;
    }

    public function editarDetallesPedido(string $id, array $detalles): Pedido
    {
        $pedido = $this->pedidos->obtenerPorId($id)
            ?? throw new DominioExcepcion('Pedido no encontrado.');
        $pedido->reemplazarDetalles($detalles);
        $this->pedidos->reemplazarDetalles($pedido);
        return $pedido;
    }

    public function eliminarPedido(string $id): void
    {
        if ($this->pedidos->obtenerPorId($id) === null) {
            throw new DominioExcepcion('Pedido no encontrado.');
        }
        $this->pedidos->eliminar($id);
    }

    /** @return Pedido[] */
    public function listarPedidos(int $pagina = 1, int $tamanio = 20, array $filtros = []): array
    {
        return $this->pedidos->listar($pagina, $tamanio, $filtros);
    }
}
