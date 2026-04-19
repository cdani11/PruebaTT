<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Pedido;

use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class DetallePedido
{
    public function __construct(
        private string $producto,
        private int $cantidad,
        private float $precioUnitario
    ) {
        if ($cantidad <= 0) {
            throw new DominioExcepcion('La cantidad debe ser mayor a cero.');
        }
        if ($precioUnitario < 0) {
            throw new DominioExcepcion('El precio no puede ser negativo.');
        }
    }

    public function producto(): string { return $this->producto; }
    public function cantidad(): int { return $this->cantidad; }
    public function precioUnitario(): float { return $this->precioUnitario; }
    public function subtotal(): float { return $this->cantidad * $this->precioUnitario; }
}
