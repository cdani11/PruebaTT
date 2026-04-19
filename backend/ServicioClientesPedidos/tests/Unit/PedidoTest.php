<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Tests\Unit;

use PHPUnit\Framework\TestCase;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;
use PruebaTT\ClientesPedidos\Domain\Pedido\EstadoPedido;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;

final class PedidoTest extends TestCase
{
    public function test_pedido_recien_creado_esta_pendiente(): void
    {
        $pedido = Pedido::crear('cliente-1');
        $this->assertSame(EstadoPedido::Pendiente, $pedido->estado());
        $this->assertSame(0.0, $pedido->total());
    }

    public function test_no_se_puede_confirmar_pedido_sin_detalles(): void
    {
        $pedido = Pedido::crear('cliente-1');
        $this->expectException(DominioExcepcion::class);
        $pedido->confirmar();
    }

    public function test_total_suma_subtotales(): void
    {
        $pedido = Pedido::crear('cliente-1');
        $pedido->agregarDetalle('A', 2, 10.0);
        $pedido->agregarDetalle('B', 1, 5.5);
        $this->assertEquals(25.5, $pedido->total());
    }
}
