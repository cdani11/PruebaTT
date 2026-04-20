<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Infrastructure\Repositorios;

use PruebaTT\ClientesPedidos\Domain\Cliente\Cliente;
use PruebaTT\ClientesPedidos\Domain\Cliente\IClienteRepository;
use PruebaTT\ClientesPedidos\Infrastructure\Persistencia\ConexionSqlServer;

final class ClienteRepository implements IClienteRepository
{
    public function __construct(private ConexionSqlServer $conexion) {}

    public function obtenerPorId(string $id): ?Cliente
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ObtenerClientePorId :Id'
        );
        $stmt->execute([':Id' => $id]);
        $fila = $stmt->fetch();
        return $fila ? $this->mapear($fila) : null;
    }

    public function obtenerPorCorreo(string $correo): ?Cliente
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ObtenerClientePorCorreo :CorreoElectronico'
        );
        $stmt->execute([':CorreoElectronico' => strtolower($correo)]);
        $fila = $stmt->fetch();
        return $fila ? $this->mapear($fila) : null;
    }

    public function listar(int $pagina, int $tamanio): array
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ListarClientes :Pagina, :Tamanio'
        );
        $stmt->bindValue(':Pagina',  $pagina,   \PDO::PARAM_INT);
        $stmt->bindValue(':Tamanio', $tamanio,  \PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($f) => $this->mapear($f), $stmt->fetchAll());
    }

    public function existeCorreo(string $correo): bool
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ExisteCorreoCliente :CorreoElectronico'
        );
        $stmt->execute([':CorreoElectronico' => strtolower($correo)]);
        return (bool) $stmt->fetchColumn();
    }

    public function agregar(Cliente $cliente): void
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_AgregarCliente :Id, :Nombres, :Apellidos, :CorreoElectronico, :Telefono, :FechaRegistro, :Activo'
        );
        $stmt->bindValue(':Id',                $cliente->id());
        $stmt->bindValue(':Nombres',           $cliente->nombres());
        $stmt->bindValue(':Apellidos',         $cliente->apellidos());
        $stmt->bindValue(':CorreoElectronico', $cliente->correoElectronico());
        $stmt->bindValue(':Telefono',          $cliente->telefono());
        $stmt->bindValue(':FechaRegistro',     $cliente->fechaRegistro()->format('Y-m-d H:i:s'));
        $stmt->bindValue(':Activo',            $cliente->activo() ? 1 : 0, \PDO::PARAM_INT);
        $stmt->execute();
    }

    public function actualizar(Cliente $cliente): void
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_ActualizarCliente :Id, :Nombres, :Apellidos, :CorreoElectronico, :Telefono'
        );
        $stmt->bindValue(':Id',                $cliente->id());
        $stmt->bindValue(':Nombres',           $cliente->nombres());
        $stmt->bindValue(':Apellidos',         $cliente->apellidos());
        $stmt->bindValue(':CorreoElectronico', $cliente->correoElectronico());
        $stmt->bindValue(':Telefono',          $cliente->telefono());
        $stmt->execute();
    }

    public function eliminar(string $id): void
    {
        $stmt = $this->conexion->obtener()->prepare('EXEC sp_EliminarCliente :Id');
        $stmt->execute([':Id' => $id]);
    }

    private function mapear(array $f): Cliente
    {
        return new Cliente(
            id: $f['Id'],
            nombres: $f['Nombres'],
            apellidos: $f['Apellidos'],
            correoElectronico: $f['CorreoElectronico'],
            telefono: $f['Telefono'],
            fechaRegistro: new \DateTimeImmutable($f['FechaRegistro']),
            activo: (bool) $f['Activo']
        );
    }
}
