<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Tests\Unit;

use Mockery;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;
use PruebaTT\ClientesPedidos\Application\Cliente\ClienteAppService;
use PruebaTT\ClientesPedidos\Domain\Cliente\Cliente;
use PruebaTT\ClientesPedidos\Domain\Cliente\IClienteRepository;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class ClienteAppServiceTest extends TestCase
{
    private IClienteRepository&MockInterface $repo;
    private ClienteAppService $sut;

    protected function setUp(): void
    {
        $this->repo = Mockery::mock(IClienteRepository::class);
        $this->sut  = new ClienteAppService($this->repo);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function test_crear_cliente_lanza_excepcion_si_correo_existe(): void
    {
        $this->repo->shouldReceive('existeCorreo')->once()->andReturn(true);

        $this->expectException(DominioExcepcion::class);
        $this->sut->crearCliente([
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'correoElectronico' => 'juan@ejemplo.com',
        ]);
    }

    public function test_crear_cliente_llama_agregar_en_repositorio(): void
    {
        $this->repo->shouldReceive('existeCorreo')->once()->andReturn(false);
        $this->repo->shouldReceive('agregar')->once();

        $cliente = $this->sut->crearCliente([
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'correoElectronico' => 'juan@ejemplo.com',
        ]);

        $this->assertSame('Juan', $cliente->nombres());
    }

    public function test_obtener_cliente_lanza_excepcion_si_no_existe(): void
    {
        $this->repo->shouldReceive('obtenerPorId')->once()->andReturn(null);

        $this->expectException(DominioExcepcion::class);
        $this->sut->obtenerCliente('id-inexistente');
    }

    public function test_actualizar_cliente_lanza_excepcion_si_correo_ya_tomado(): void
    {
        $clienteExistente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $this->repo->shouldReceive('obtenerPorId')->once()->andReturn($clienteExistente);
        $this->repo->shouldReceive('existeCorreo')->once()->with('otro@ejemplo.com')->andReturn(true);

        $this->expectException(DominioExcepcion::class);
        $this->sut->actualizarCliente('id-1', [
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'correoElectronico' => 'otro@ejemplo.com',
        ]);
    }

    public function test_actualizar_cliente_mismo_correo_no_valida_unicidad(): void
    {
        $clienteExistente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $this->repo->shouldReceive('obtenerPorId')->once()->andReturn($clienteExistente);
        $this->repo->shouldReceive('actualizar')->once();

        $resultado = $this->sut->actualizarCliente('id-1', [
            'nombres' => 'Juan Actualizado',
            'apellidos' => 'Pérez',
            'correoElectronico' => 'juan@ejemplo.com',
        ]);

        $this->assertSame('Juan Actualizado', $resultado->nombres());
    }

    public function test_eliminar_cliente_lanza_excepcion_si_no_existe(): void
    {
        $this->repo->shouldReceive('obtenerPorId')->once()->andReturn(null);

        $this->expectException(DominioExcepcion::class);
        $this->sut->eliminarCliente('id-inexistente');
    }

    public function test_eliminar_cliente_llama_eliminar_en_repositorio(): void
    {
        $clienteExistente = Cliente::crear('Juan', 'Pérez', 'juan@ejemplo.com', null);
        $this->repo->shouldReceive('obtenerPorId')->once()->andReturn($clienteExistente);
        $this->repo->shouldReceive('eliminar')->once();

        $this->sut->eliminarCliente('id-1');
        $this->assertTrue(true);
    }
}
