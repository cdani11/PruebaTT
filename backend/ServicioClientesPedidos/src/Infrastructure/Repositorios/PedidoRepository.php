<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Infrastructure\Repositorios;

use PruebaTT\ClientesPedidos\Domain\Pedido\DetallePedido;
use PruebaTT\ClientesPedidos\Domain\Pedido\EstadoPedido;
use PruebaTT\ClientesPedidos\Domain\Pedido\IPedidoRepository;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;
use PruebaTT\ClientesPedidos\Infrastructure\Persistencia\ConexionSqlServer;

final class PedidoRepository implements IPedidoRepository
{
    public function __construct(private ConexionSqlServer $conexion) {}

    public function obtenerPorId(string $id): ?Pedido
    {
        $pdo = $this->conexion->obtener();
        $stmt = $pdo->prepare('SELECT * FROM Pedidos WHERE Id = :id');
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch();
        if (!$fila) return null;
        return $this->mapearConDetalles($pdo, $fila);
    }

    public function listarPorCliente(string $clienteId): array
    {
        $pdo = $this->conexion->obtener();
        $stmt = $pdo->prepare('SELECT * FROM Pedidos WHERE ClienteId = :c ORDER BY FechaCreacion DESC');
        $stmt->execute(['c' => $clienteId]);
        return array_map(fn($f) => $this->mapearConDetalles($pdo, $f), $stmt->fetchAll());
    }

    public function listar(int $pagina, int $tamanio): array
    {
        $pdo = $this->conexion->obtener();
        $offset = ($pagina - 1) * $tamanio;
        $stmt = $pdo->prepare(
            'SELECT * FROM Pedidos ORDER BY FechaCreacion DESC OFFSET :off ROWS FETCH NEXT :tam ROWS ONLY'
        );
        $stmt->bindValue('off', $offset, \PDO::PARAM_INT);
        $stmt->bindValue('tam', $tamanio, \PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($f) => $this->mapearConDetalles($pdo, $f), $stmt->fetchAll());
    }

    public function agregar(Pedido $pedido): void
    {
        $pdo = $this->conexion->obtener();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO Pedidos (Id, ClienteId, FechaCreacion, Estado, Total)
                 VALUES (:id, :c, :f, :e, :t)'
            );
            $stmt->execute([
                'id' => $pedido->id(),
                'c' => $pedido->clienteId(),
                'f' => $pedido->fechaCreacion()->format('Y-m-d H:i:s'),
                'e' => $pedido->estado()->value,
                't' => $pedido->total(),
            ]);
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
            'UPDATE Pedidos SET Estado = :e, Total = :t WHERE Id = :id'
        );
        $stmt->execute([
            'e' => $pedido->estado()->value,
            't' => $pedido->total(),
            'id' => $pedido->id(),
        ]);
    }

    private function insertarDetalles(\PDO $pdo, Pedido $pedido): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO PedidoDetalles (PedidoId, Producto, Cantidad, PrecioUnitario)
             VALUES (:pid, :p, :c, :pr)'
        );
        foreach ($pedido->detalles() as $d) {
            $stmt->execute([
                'pid' => $pedido->id(),
                'p' => $d->producto(),
                'c' => $d->cantidad(),
                'pr' => $d->precioUnitario(),
            ]);
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

        $stmt = $pdo->prepare('SELECT * FROM PedidoDetalles WHERE PedidoId = :id');
        $stmt->execute(['id' => $fila['Id']]);
        foreach ($stmt->fetchAll() as $d) {
            $pedido->agregarDetalle($d['Producto'], (int)$d['Cantidad'], (float)$d['PrecioUnitario']);
        }
        return $pedido;
    }
}
