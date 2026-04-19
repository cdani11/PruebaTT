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
            'SELECT * FROM Clientes WHERE Id = :id'
        );
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch();
        return $fila ? $this->mapear($fila) : null;
    }

    public function obtenerPorCorreo(string $correo): ?Cliente
    {
        $stmt = $this->conexion->obtener()->prepare(
            'SELECT * FROM Clientes WHERE CorreoElectronico = :c'
        );
        $stmt->execute(['c' => strtolower($correo)]);
        $fila = $stmt->fetch();
        return $fila ? $this->mapear($fila) : null;
    }

    public function listar(int $pagina, int $tamanio): array
    {
        $offset = ($pagina - 1) * $tamanio;
        $stmt = $this->conexion->obtener()->prepare(
            'SELECT * FROM Clientes ORDER BY FechaRegistro DESC OFFSET :off ROWS FETCH NEXT :tam ROWS ONLY'
        );
        $stmt->bindValue('off', $offset, \PDO::PARAM_INT);
        $stmt->bindValue('tam', $tamanio, \PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($f) => $this->mapear($f), $stmt->fetchAll());
    }

    public function existeCorreo(string $correo): bool
    {
        $stmt = $this->conexion->obtener()->prepare(
            'SELECT 1 FROM Clientes WHERE CorreoElectronico = :c'
        );
        $stmt->execute(['c' => strtolower($correo)]);
        return (bool)$stmt->fetchColumn();
    }

    public function agregar(Cliente $cliente): void
    {
        $stmt = $this->conexion->obtener()->prepare(
            'INSERT INTO Clientes (Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo)
             VALUES (:id, :n, :a, :c, :t, :f, :ac)'
        );
        $stmt->execute([
            'id' => $cliente->id(),
            'n' => $cliente->nombres(),
            'a' => $cliente->apellidos(),
            'c' => $cliente->correoElectronico(),
            't' => $cliente->telefono(),
            'f' => $cliente->fechaRegistro()->format('Y-m-d H:i:s'),
            'ac' => $cliente->activo() ? 1 : 0,
        ]);
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
            activo: (bool)$f['Activo']
        );
    }
}
