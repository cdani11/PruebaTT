<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Controllers;

use PruebaTT\ClientesPedidos\Application\Cliente\ClienteAppService;
use PruebaTT\ClientesPedidos\Domain\Cliente\Cliente;
use PruebaTT\ClientesPedidos\Presentation\Http\Respuesta;

final class ClienteController
{
    public function __construct(private ClienteAppService $servicio) {}

    public function crear(array $_args, array $cuerpo, array $_query): void
    {
        $cliente = $this->servicio->crearCliente($cuerpo);
        Respuesta::exito($this->serializar($cliente), 201);
    }

    public function obtener(array $args, array $_cuerpo, array $_query): void
    {
        $cliente = $this->servicio->obtenerCliente($args['id']);
        Respuesta::exito($this->serializar($cliente));
    }

    public function listar(array $_args, array $_cuerpo, array $query): void
    {
        $pagina = (int)($query['pagina'] ?? 1);
        $tamanio = (int)($query['tamanio'] ?? 20);
        $clientes = array_map(fn(Cliente $c) => $this->serializar($c), $this->servicio->listarClientes($pagina, $tamanio));
        Respuesta::exito($clientes);
    }

    private function serializar(Cliente $c): array
    {
        return [
            'id' => $c->id(),
            'nombres' => $c->nombres(),
            'apellidos' => $c->apellidos(),
            'correoElectronico' => $c->correoElectronico(),
            'telefono' => $c->telefono(),
            'fechaRegistro' => $c->fechaRegistro()->format(DATE_ATOM),
            'activo' => $c->activo(),
        ];
    }
}
