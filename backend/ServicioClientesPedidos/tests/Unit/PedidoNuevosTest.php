<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Tests\Unit;

use PHPUnit\Framework\TestCase;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;
use PruebaTT\ClientesPedidos\Domain\Pedido\EstadoPedido;
use PruebaTT\ClientesPedidos\Domain\Pedido\Pedido;

final class PedidoNuevosTest extends TestCase
{
    private function pedidoConfirmado(): Pedido
    {
        $pedido = Pedido::crear('cliente-1');
        $pedido->agregarDetalle('Producto A', 2, 10.0);
        $pedido->confirmar();
        return $pedido;
    }

    public function test_completar_pedido_confirmado_cambia_estado_a_entregado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->completar();
        $this->assertSame(EstadoPedido::Entregado, $pedido->estado());
    }

    public function test_no_se_puede_completar_pedido_pendiente(): void
    {
        $pedido = Pedido::crear('cliente-1');
        $pedido->agregarDetalle('A', 1, 5.0);
        $this->expectException(DominioExcepcion::class);
        $pedido->completar();
    }

    public function test_no_se_puede_completar_pedido_cancelado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->cancelar();
        $this->expectException(DominioExcepcion::class);
        $pedido->completar();
    }

    public function test_no_se_puede_cancelar_pedido_entregado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->completar();
        $this->expectException(DominioExcepcion::class);
        $pedido->cancelar();
    }

    public function test_no_se_pueden_agregar_detalles_a_pedido_confirmado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $this->expectException(DominioExcepcion::class);
        $pedido->agregarDetalle('Extra', 1, 1.0);
    }

    public function test_pedido_sin_cliente_lanza_excepcion(): void
    {
        $this->expectException(DominioExcepcion::class);
        Pedido::crear('');
    }

    public function test_reemplazar_detalles_en_pedido_confirmado_actualiza_total(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->reemplazarDetalles([
            ['producto' => 'Nuevo', 'cantidad' => 3, 'precioUnitario' => 20.0],
        ]);
        $this->assertSame(60.0, $pedido->total());
    }

    public function test_no_se_pueden_reemplazar_detalles_en_pedido_cancelado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->cancelar();
        $this->expectException(DominioExcepcion::class);
        $pedido->reemplazarDetalles([['producto' => 'A', 'cantidad' => 1, 'precioUnitario' => 5.0]]);
    }

    public function test_no_se_pueden_reemplazar_detalles_en_pedido_entregado(): void
    {
        $pedido = $this->pedidoConfirmado();
        $pedido->completar();
        $this->expectException(DominioExcepcion::class);
        $pedido->reemplazarDetalles([['producto' => 'A', 'cantidad' => 1, 'precioUnitario' => 5.0]]);
    }

    public function test_reemplazar_con_lista_vacia_lanza_excepcion(): void
    {
        $pedido = $this->pedidoConfirmado();
        $this->expectException(DominioExcepcion::class);
        $pedido->reemplazarDetalles([]);
    }
}
