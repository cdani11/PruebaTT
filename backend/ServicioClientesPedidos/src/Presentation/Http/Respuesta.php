<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Http;

final class Respuesta
{
    public static function exito(mixed $datos = null, int $codigo = 200): void
    {
        self::enviar($codigo, ['exito' => true, 'datos' => $datos, 'errores' => []]);
    }

    public static function error(int $codigo, string ...$errores): void
    {
        self::enviar($codigo, ['exito' => false, 'datos' => null, 'errores' => $errores]);
    }

    private static function enviar(int $codigo, array $cuerpo): void
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
