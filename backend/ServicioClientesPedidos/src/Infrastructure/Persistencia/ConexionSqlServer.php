<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Infrastructure\Persistencia;

final class ConexionSqlServer
{
    private ?\PDO $pdo = null;

    public function __construct(
        private string $servidor,
        private string $baseDatos,
        private string $usuario,
        private string $clave
    ) {}

    public function obtener(): \PDO
    {
        if ($this->pdo === null) {
            $dsn = "sqlsrv:Server={$this->servidor};Database={$this->baseDatos};TrustServerCertificate=yes";
            $this->pdo = new \PDO($dsn, $this->usuario, $this->clave, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            ]);
        }
        return $this->pdo;
    }
}
