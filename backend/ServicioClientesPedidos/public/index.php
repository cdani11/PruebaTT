<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use PruebaTT\ClientesPedidos\Presentation\Bootstrap\Aplicacion;

$app = new Aplicacion(__DIR__ . '/..');
$app->ejecutar();
