<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Cliente;

use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class Cliente
{
    public function __construct(
        private string $id,
        private string $nombres,
        private string $apellidos,
        private string $correoElectronico,
        private ?string $telefono,
        private \DateTimeImmutable $fechaRegistro,
        private bool $activo = true
    ) {
        if (trim($nombres) === '') {
            throw new DominioExcepcion('Los nombres son obligatorios.');
        }
        if (!filter_var($correoElectronico, FILTER_VALIDATE_EMAIL)) {
            throw new DominioExcepcion('Correo electrónico inválido.');
        }
    }

    public static function crear(string $nombres, string $apellidos, string $correo, ?string $telefono): self
    {
        return new self(
            id: self::generarId(),
            nombres: $nombres,
            apellidos: $apellidos,
            correoElectronico: strtolower(trim($correo)),
            telefono: $telefono,
            fechaRegistro: new \DateTimeImmutable('now', new \DateTimeZone('UTC'))
        );
    }

    public function desactivar(): void { $this->activo = false; }

    public function id(): string { return $this->id; }
    public function nombres(): string { return $this->nombres; }
    public function apellidos(): string { return $this->apellidos; }
    public function correoElectronico(): string { return $this->correoElectronico; }
    public function telefono(): ?string { return $this->telefono; }
    public function fechaRegistro(): \DateTimeImmutable { return $this->fechaRegistro; }
    public function activo(): bool { return $this->activo; }

    private static function generarId(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
