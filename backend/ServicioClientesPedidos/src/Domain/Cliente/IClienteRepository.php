<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Cliente;

interface IClienteRepository
{
    public function obtenerPorId(string $id): ?Cliente;
    public function obtenerPorCorreo(string $correo): ?Cliente;
    /** @return Cliente[] */
    public function listar(int $pagina, int $tamanio): array;
    public function existeCorreo(string $correo): bool;
    public function agregar(Cliente $cliente): void;
    public function actualizar(Cliente $cliente): void;
    public function eliminar(string $id): void;
}
