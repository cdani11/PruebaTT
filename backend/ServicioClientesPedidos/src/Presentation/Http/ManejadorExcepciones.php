<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Http;

use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class ManejadorExcepciones
{
    public function manejar(\Throwable $e): void
    {
        if ($e instanceof DominioExcepcion) {
            Respuesta::error(400, $e->getMessage());
            return;
        }
        error_log((string)$e);
        Respuesta::error(500, 'Error interno del servidor.');
    }
}
