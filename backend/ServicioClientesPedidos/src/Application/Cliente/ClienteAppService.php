<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Application\Cliente;

use PruebaTT\ClientesPedidos\Domain\Cliente\Cliente;
use PruebaTT\ClientesPedidos\Domain\Cliente\IClienteRepository;
use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class ClienteAppService
{
    public function __construct(private IClienteRepository $repositorio) {}

    public function crearCliente(array $datos): Cliente
    {
        if ($this->repositorio->existeCorreo($datos['correoElectronico'] ?? '')) {
            throw new DominioExcepcion('Ya existe un cliente con ese correo.');
        }

        $cliente = Cliente::crear(
            nombres: $datos['nombres'] ?? '',
            apellidos: $datos['apellidos'] ?? '',
            correo: $datos['correoElectronico'] ?? '',
            telefono: $datos['telefono'] ?? null
        );
        $this->repositorio->agregar($cliente);
        return $cliente;
    }

    public function obtenerCliente(string $id): Cliente
    {
        return $this->repositorio->obtenerPorId($id)
            ?? throw new DominioExcepcion('Cliente no encontrado.');
    }

    /** @return Cliente[] */
    public function listarClientes(int $pagina = 1, int $tamanio = 20): array
    {
        return $this->repositorio->listar($pagina, $tamanio);
    }
}
