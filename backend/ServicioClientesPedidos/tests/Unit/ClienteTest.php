<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Tests\Unit;

use PHPUnit\Framework\TestCase;
use PruebaTT\ClientesPedidos\Domain\Cliente\Cliente;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class ClienteTest extends TestCase
{
    public function test_crear_cliente_con_datos_validos(): void
    {
        $cliente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', '123456789');

        $this->assertSame('Juan', $cliente->nombres());
        $this->assertSame('Pérez', $cliente->apellidos());
        $this->assertSame('juan@ejemplo.com', $cliente->correoElectronico());
        $this->assertSame('123456789', $cliente->telefono());
        $this->assertTrue($cliente->activo());
    }

    public function test_correo_se_normaliza_a_minusculas(): void
    {
        $cliente = Cliente::crear('Ana', 'López', 'ANA@EJEMPLO.COM', null);
        $this->assertSame('ana@ejemplo.com', $cliente->correoElectronico());
    }

    public function test_lanza_excepcion_con_correo_invalido(): void
    {
        $this->expectException(DominioExcepcion::class);
        Cliente::crear('Juan', 'Pérez', 'no-es-correo', null);
    }

    public function test_lanza_excepcion_con_nombres_vacios(): void
    {
        $this->expectException(DominioExcepcion::class);
        Cliente::crear('', 'Pérez', 'juan@ejemplo.com', null);
    }

    public function test_desactivar_cambia_estado(): void
    {
        $cliente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $cliente->desactivar();
        $this->assertFalse($cliente->activo());
    }

    public function test_actualizar_datos_cambia_campos(): void
    {
        $cliente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $cliente->actualizarDatos('Carlos', 'García', 'carlos@ejemplo.com', '555-1234');

        $this->assertSame('Carlos', $cliente->nombres());
        $this->assertSame('García', $cliente->apellidos());
        $this->assertSame('carlos@ejemplo.com', $cliente->correoElectronico());
        $this->assertSame('555-1234', $cliente->telefono());
    }

    public function test_actualizar_datos_lanza_excepcion_con_correo_invalido(): void
    {
        $cliente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $this->expectException(DominioExcepcion::class);
        $cliente->actualizarDatos('Juan', 'Pérez', 'no-valido', null);
    }
}
