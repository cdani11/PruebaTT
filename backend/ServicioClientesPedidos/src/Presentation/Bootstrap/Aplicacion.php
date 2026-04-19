<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Bootstrap;

use PruebaTT\ClientesPedidos\Application\Cliente\ClienteAppService;
use PruebaTT\ClientesPedidos\Application\Pedido\PedidoAppService;
use PruebaTT\ClientesPedidos\Infrastructure\Persistencia\ConexionSqlServer;
use PruebaTT\ClientesPedidos\Infrastructure\Repositorios\ClienteRepository;
use PruebaTT\ClientesPedidos\Infrastructure\Repositorios\PedidoRepository;
use PruebaTT\ClientesPedidos\Presentation\Controllers\ClienteController;
use PruebaTT\ClientesPedidos\Presentation\Controllers\PedidoController;
use PruebaTT\ClientesPedidos\Presentation\Http\Enrutador;
use PruebaTT\ClientesPedidos\Presentation\Http\ManejadorExcepciones;

final class Aplicacion
{
    public function __construct(private string $rutaBase) {}

    public function ejecutar(): void
    {
        $dotenv = \Dotenv\Dotenv::createImmutable($this->rutaBase);
        $dotenv->safeLoad();

        try {
            $conexion = new ConexionSqlServer(
                servidor: $_ENV['DB_SERVIDOR'] ?? 'localhost',
                baseDatos: $_ENV['DB_NOMBRE'] ?? 'ClientesPedidosDb',
                usuario: $_ENV['DB_USUARIO'] ?? 'sa',
                clave: $_ENV['DB_CLAVE'] ?? ''
            );

            $clienteRepo = new ClienteRepository($conexion);
            $pedidoRepo = new PedidoRepository($conexion);

            $clienteCtrl = new ClienteController(new ClienteAppService($clienteRepo));
            $pedidoCtrl = new PedidoController(new PedidoAppService($pedidoRepo, $clienteRepo));

            $enrutador = new Enrutador();
            $enrutador->registrar('POST', '/api/v1/clientes', [$clienteCtrl, 'crear']);
            $enrutador->registrar('GET',  '/api/v1/clientes', [$clienteCtrl, 'listar']);
            $enrutador->registrar('GET',  '/api/v1/clientes/{id}', [$clienteCtrl, 'obtener']);
            $enrutador->registrar('POST', '/api/v1/pedidos', [$pedidoCtrl, 'crear']);
            $enrutador->registrar('GET',  '/api/v1/pedidos', [$pedidoCtrl, 'listar']);
            $enrutador->registrar('DELETE', '/api/v1/pedidos/{id}', [$pedidoCtrl, 'cancelar']);

            $enrutador->despachar($_SERVER['REQUEST_METHOD'], parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
        } catch (\Throwable $e) {
            (new ManejadorExcepciones())->manejar($e);
        }
    }
}
