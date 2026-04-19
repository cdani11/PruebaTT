<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Pedido;

use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class Pedido
{
    /** @var DetallePedido[] */
    private array $detalles = [];

    public function __construct(
        private string $id,
        private string $clienteId,
        private \DateTimeImmutable $fechaCreacion,
        private EstadoPedido $estado
    ) {}

    public static function crear(string $clienteId): self
    {
        if (trim($clienteId) === '') {
            throw new DominioExcepcion('El cliente es obligatorio.');
        }
        return new self(
            id: bin2hex(random_bytes(16)),
            clienteId: $clienteId,
            fechaCreacion: new \DateTimeImmutable('now', new \DateTimeZone('UTC')),
            estado: EstadoPedido::Pendiente
        );
    }

    public function agregarDetalle(string $producto, int $cantidad, float $precioUnitario): void
    {
        if ($this->estado !== EstadoPedido::Pendiente) {
            throw new DominioExcepcion('Solo se pueden agregar detalles a pedidos pendientes.');
        }
        $this->detalles[] = new DetallePedido($producto, $cantidad, $precioUnitario);
    }

    public function confirmar(): void
    {
        if (count($this->detalles) === 0) {
            throw new DominioExcepcion('Un pedido debe tener al menos un detalle.');
        }
        $this->estado = EstadoPedido::Confirmado;
    }

    public function cancelar(): void
    {
        if ($this->estado === EstadoPedido::Entregado) {
            throw new DominioExcepcion('No se puede cancelar un pedido entregado.');
        }
        $this->estado = EstadoPedido::Cancelado;
    }

    public function total(): float
    {
        $total = 0.0;
        foreach ($this->detalles as $d) {
            $total += $d->subtotal();
        }
        return $total;
    }

    public function id(): string { return $this->id; }
    public function clienteId(): string { return $this->clienteId; }
    public function fechaCreacion(): \DateTimeImmutable { return $this->fechaCreacion; }
    public function estado(): EstadoPedido { return $this->estado; }
    /** @return DetallePedido[] */
    public function detalles(): array { return $this->detalles; }
}
