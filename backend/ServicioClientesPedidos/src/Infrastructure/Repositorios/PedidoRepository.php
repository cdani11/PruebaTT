<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Infrastructure\Repositorios;

use PruebaTT\ClientesPedidos\Domain\Pedido\EstadoPedido;
use PruebaTT\ClientesPedidos\Domain\Pedido\IPedidoRepository;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;
use PruebaTT\ClientesPedidos\Infrastructure\Persistencia\ConexionSqlServer;

final class PedidoRepository implements IPedidoRepository
{
    public function __construct(private ConexionSqlServer $conexion) {}

    public function obtenerPorId(string $id): ?Pedido
    {
        $pdo  = $this->conexion->obtener();
        $stmt = $pdo->prepare('EXEC sp_ObtenerPedidoPorId :Id');
        $stmt->execute([':Id' => $id]);
        $fila = $stmt->fetch();
        if (!$fila) return null;
        return $this->mapearConDetalles($pdo, $fila);
    }

    public function listarPorCliente(string $clienteId): array
    {
        $pdo  = $this->conexion->obtener();
        $stmt = $pdo->prepare('EXEC sp_ListarPedidosPorCliente :ClienteId');
        $stmt->execute([':ClienteId' => $clienteId]);
        return array_map(fn($f) => $this->mapearConDetalles($pdo, $f), $stmt->fetchAll());
    }

    public function listar(int $pagina, int $tamanio, array $filtros = []): array
    {
        $pdo  = $this->conexion->obtener();
        $stmt = $pdo->prepare(
            'EXEC sp_ListarPedidos :Pagina, :Tamanio, :Estado, :FechaDesde, :FechaHasta, :ClienteId'
        );
        $stmt->bindValue(':Pagina',     $pagina,                       \PDO::PARAM_INT);
        $stmt->bindValue(':Tamanio',    $tamanio,                      \PDO::PARAM_INT);
        $stmt->bindValue(':Estado',     $filtros['estado']     ?? null);
        $stmt->bindValue(':FechaDesde', $filtros['fechaDesde'] ?? null);
        $stmt->bindValue(':FechaHasta', $filtros['fechaHasta'] ?? null);
        $stmt->bindValue(':ClienteId',  $filtros['clienteId']  ?? null);
        $stmt->execute();
        return array_map(fn($f) => $this->mapearConDetalles($pdo, $f), $stmt->fetchAll());
    }

    public function reemplazarDetalles(Pedido $pedido): void
    {
        $pdo = $this->conexion->obtener();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('EXEC sp_EliminarDetallesPedido :PedidoId');
            $stmt->execute([':PedidoId' => $pedido->id()]);
            $this->insertarDetalles($pdo, $pedido);
            $stmt2 = $pdo->prepare('EXEC sp_ActualizarPedido :Id, :Estado, :Total');
            $stmt2->bindValue(':Id',     $pedido->id());
            $stmt2->bindValue(':Estado', $pedido->estado()->value);
            $stmt2->bindValue(':Total',  $pedido->total());
            $stmt2->execute();
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public function eliminar(string $id): void
    {
        $stmt = $this->conexion->obtener()->prepare('EXEC sp_EliminarPedido :Id');
        $stmt->execute([':Id' => $id]);
    }

    public function agregar(Pedido $pedido): void
    {
        $pdo = $this->conexion->obtener();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'EXEC sp_AgregarPedido :Id, :ClienteId, :FechaCreacion, :Estado, :Total'
            );
            $stmt->bindValue(':Id',            $pedido->id());
            $stmt->bindValue(':ClienteId',     $pedido->clienteId());
            $stmt->bindValue(':FechaCreacion', $pedido->fechaCreacion()->format('Y-m-d H:i:s'));
            $stmt->bindValue(':Estado',        $pedido->estado()->value);
            $stmt->bindValue(':Total',         $pedido->total());
            $stmt->execute();

            $this->insertarDetalles($pdo, $pedido);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public function actualizar(Pedido $pedido): void
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ActualizarPedido :Id, :Estado, :Total'
        );
        $stmt->bindValue(':Id',     $pedido->id());
        $stmt->bindValue(':Estado', $pedido->estado()->value);
        $stmt->bindValue(':Total',  $pedido->total());
        $stmt->execute();
    }

    private function insertarDetalles(\PDO $pdo, Pedido $pedido): void
    {
        $stmt = $pdo->prepare(
            'EXEC sp_AgregarDetallePedido :PedidoId, :Producto, :Cantidad, :PrecioUnitario'
        );
        foreach ($pedido->detalles() as $d) {
            $stmt->bindValue(':PedidoId',       $pedido->id());
            $stmt->bindValue(':Producto',       $d->producto());
            $stmt->bindValue(':Cantidad',       $d->cantidad(),        \PDO::PARAM_INT);
            $stmt->bindValue(':PrecioUnitario', $d->precioUnitario());
            $stmt->execute();
        }
    }

    private function mapearConDetalles(\PDO $pdo, array $fila): Pedido
    {
        $pedido = new Pedido(
            id: $fila['Id'],
            clienteId: $fila['ClienteId'],
            fechaCreacion: new \DateTimeImmutable($fila['FechaCreacion']),
            estado: EstadoPedido::from($fila['Estado'])
        );

        $stmt = $pdo->prepare('EXEC sp_ObtenerDetallesPedido :PedidoId');
        $stmt->execute([':PedidoId' => $fila['Id']]);
        foreach ($stmt->fetchAll() as $d) {
            $pedido->cargarDetalle($d['Producto'], (int) $d['Cantidad'], (float) $d['PrecioUnitario']);
        }
        return $pedido;
    }
}
