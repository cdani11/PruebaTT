<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Pedido;

interface IPedidoRepository
{
    public function obtenerPorId(string $id): ?Pedido;
    /** @return Pedido[] */
    public function listarPorCliente(string $clienteId): array;
    /** @return Pedido[] */
    public function listar(int $pagina, int $tamanio): array;
    public function agregar(Pedido $pedido): void;
    public function actualizar(Pedido $pedido): void;
}
