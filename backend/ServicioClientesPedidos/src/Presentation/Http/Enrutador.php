<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Http;

final class Enrutador
{
    /** @var array<int, array{metodo:string, patron:string, manejador:callable, parametros:array}> */
    private array $rutas = [];

    public function registrar(string $metodo, string $ruta, callable $manejador): void
    {
        $parametros = [];
        $patron = preg_replace_callback('/\{(\w+)\}/', function ($m) use (&$parametros) {
            $parametros[] = $m[1];
            return '([^/]+)';
        }, $ruta);

        $this->rutas[] = [
            'metodo' => strtoupper($metodo),
            'patron' => '#^' . $patron . '$#',
            'manejador' => $manejador,
            'parametros' => $parametros,
        ];
    }

    public function despachar(string $metodo, string $ruta): void
    {
        foreach ($this->rutas as $r) {
            if ($r['metodo'] !== strtoupper($metodo)) continue;
            if (preg_match($r['patron'], $ruta, $coincidencias)) {
                array_shift($coincidencias);
                $args = array_combine($r['parametros'], $coincidencias) ?: [];
                $cuerpo = json_decode(file_get_contents('php://input') ?: '[]', true) ?? [];
                ($r['manejador'])($args, $cuerpo, $_GET);
                return;
            }
        }
        Respuesta::error(404, 'Ruta no encontrada.');
    }
}
