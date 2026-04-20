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

    public function actualizarCliente(string $id, array $datos): Cliente
    {
        $cliente = $this->repositorio->obtenerPorId($id)
            ?? throw new DominioExcepcion('Cliente no encontrado.');

        $nuevoCorreo = strtolower(trim($datos['correoElectronico'] ?? ''));
        if ($nuevoCorreo !== $cliente->correoElectronico() && $this->repositorio->existeCorreo($nuevoCorreo)) {
            throw new DominioExcepcion('Ya existe un cliente con ese correo.');
        }

        $cliente->actualizarDatos(
            nombres: $datos['nombres'] ?? '',
            apellidos: $datos['apellidos'] ?? '',
            correoElectronico: $nuevoCorreo,
            telefono: ($datos['telefono'] ?? null) ?: null
        );
        $this->repositorio->actualizar($cliente);
        return $cliente;
    }

    public function eliminarCliente(string $id): void
    {
        if ($this->repositorio->obtenerPorId($id) === null) {
            throw new DominioExcepcion('Cliente no encontrado.');
        }
        $this->repositorio->eliminar($id);
    }

    /** @return Cliente[] */
    public function listarClientes(int $pagina = 1, int $tamanio = 20): array
    {
        return $this->repositorio->listar($pagina, $tamanio);
    }
}
