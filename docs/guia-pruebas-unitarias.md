# Guía de Pruebas Unitarias

## Resumen

| Servicio | Framework | Comando | Tests |
|---|---|---|---|
| ServicioClientesPedidos (PHP) | PHPUnit 10 + Mockery | `./vendor/bin/phpunit tests/ --testdox` | 16 |
| ServicioAutenticacion (.NET) | xUnit + Moq + FluentAssertions | `dotnet test tests/ServicioAutenticacion.UnitTests` | 2 |
| frontend-angular | Jasmine + Karma | `npm test` | 15 |
| ServicioEstadisticas (Python) | — | sin tests (ver nota) | — |

---

## PHP — ServicioClientesPedidos

### Prerrequisitos

```bash
cd backend/ServicioClientesPedidos
composer install
```

Requiere PHP 8.2+ y Composer instalados localmente. Alternativamente, se puede ejecutar
dentro del contenedor Docker (ver más abajo).

### Ejecutar todos los tests

```bash
./vendor/bin/phpunit tests/ --testdox
```

Para ver sólo los fallos:

```bash
./vendor/bin/phpunit tests/ --testdox --stop-on-failure
```

### Dentro del contenedor Docker

Si no tienes PHP local:

```bash
docker compose build servicio-clientes-pedidos
docker run --rm \
  -v "$(pwd)/backend/ServicioClientesPedidos":/app \
  -w /app \
  php:8.2-cli \
  sh -c "composer install --no-interaction && ./vendor/bin/phpunit tests/ --testdox"
```

### Suites de test

#### `tests/Unit/ClienteTest.php` — Dominio: entidad Cliente
Prueba las reglas del modelo `Cliente` de forma aislada, sin base de datos ni mocks.

| Test | Qué verifica |
|---|---|
| `crear_cliente_con_datos_validos` | El factory `Cliente::crear()` asigna correctamente los campos |
| `correo_electronico_se_normaliza_a_minusculas` | El correo se guarda en minúsculas siempre |
| `nombre_vacio_lanza_excepcion` | El dominio rechaza nombres vacíos |
| `actualizar_datos_cambia_los_campos` | `actualizarDatos()` muta estado correctamente |

#### `tests/Unit/PedidoTest.php` — Dominio: entidad Pedido (flujo básico)
Prueba el ciclo de vida principal de un pedido.

| Test | Qué verifica |
|---|---|
| `crear_pedido_inicia_en_estado_pendiente` | Estado inicial es `PENDIENTE` |
| `agregar_detalle_suma_al_total` | El total se calcula sumando subtotales |
| `confirmar_pedido_cambia_estado` | Después de `confirmar()` el estado es `CONFIRMADO` |
| `cancelar_pedido_cambia_estado` | `cancelar()` produce estado `CANCELADO` |

#### `tests/Unit/PedidoNuevosTest.php` — Dominio: reglas de negocio extendidas
Prueba las validaciones de estado y las operaciones añadidas.

| Test | Qué verifica |
|---|---|
| `completar_pedido_confirmado_cambia_a_entregado` | Flujo Confirmado → Entregado |
| `no_se_puede_completar_pedido_pendiente` | Lanza `DominioExcepcion` |
| `no_se_puede_completar_pedido_cancelado` | Lanza `DominioExcepcion` |
| `no_se_puede_cancelar_pedido_entregado` | Lanza `DominioExcepcion` |
| `no_se_pueden_agregar_detalles_a_pedido_confirmado` | Lanza `DominioExcepcion` |
| `pedido_sin_cliente_lanza_excepcion` | El factory valida `clienteId` vacío |
| `reemplazar_detalles_en_pedido_confirmado_actualiza_total` | `reemplazarDetalles()` recalcula total |
| `no_se_pueden_reemplazar_detalles_en_pedido_cancelado` | Lanza `DominioExcepcion` |
| `no_se_pueden_reemplazar_detalles_en_pedido_entregado` | Lanza `DominioExcepcion` |
| `reemplazar_con_lista_vacia_lanza_excepcion` | Lanza `DominioExcepcion` |

#### `tests/Unit/ClienteAppServiceTest.php` — Capa de aplicación con mocks
Prueba `ClienteAppService` aislando el repositorio con Mockery.

| Test | Qué verifica |
|---|---|
| `crear_cliente_lanza_excepcion_si_correo_existe` | Rechaza correos duplicados |
| `crear_cliente_llama_agregar_en_repositorio` | Llama a `$repo->agregar()` exactamente una vez |
| `obtener_cliente_lanza_excepcion_si_no_existe` | Lanza `DominioExcepcion` si `obtenerPorId()` devuelve null |
| `actualizar_cliente_lanza_excepcion_si_correo_ya_tomado` | No permite email ya usado por otro cliente |
| `actualizar_cliente_mismo_correo_no_valida_unicidad` | Actualizar sin cambiar correo no llama `existeCorreo` |
| `eliminar_cliente_lanza_excepcion_si_no_existe` | Lanza `DominioExcepcion` |
| `eliminar_cliente_llama_eliminar_en_repositorio` | Llama a `$repo->eliminar()` exactamente una vez |

### Interpretar el output

```
ClienteAppServiceTest
 ✔ Crear cliente lanza excepcion si correo existe
 ✔ Crear cliente llama agregar en repositorio
 ...

OK (16 tests, 22 assertions)
```

Un `FAIL` muestra la línea exacta y el valor esperado vs. recibido.

---

## .NET — ServicioAutenticacion

### Prerrequisitos

- .NET 8 SDK instalado (`dotnet --version` debe mostrar `8.x`)

### Ejecutar los tests

```bash
cd backend/ServicioAutenticacion
dotnet test tests/ServicioAutenticacion.UnitTests
```

Con output detallado:

```bash
dotnet test tests/ServicioAutenticacion.UnitTests --logger "console;verbosity=detailed"
```

### Suite: `AutenticacionAppServiceTests.cs`

Prueba `AutenticacionAppService` usando Moq para los colaboradores.

| Test | Qué verifica |
|---|---|
| `IniciarSesion_CorreoNoExiste_LanzaExcepcion` | Devuelve error si el usuario no está registrado |
| `IniciarSesion_ClaveIncorrecta_LanzaExcepcion` | Devuelve error si el hash de clave no coincide |

### Interpretar el output

```
Correctas! - Con error: 0, Superado: 2, Omitido: 0, Total: 2, Duración: 245 ms
```

---

## Angular — frontend-angular

### Prerrequisitos

```bash
cd frontend/frontend-angular
npm install
```

Requiere Node.js 18+ y un navegador (Chrome o Edge) instalado.

### Ejecutar los tests

```bash
npm test
```

Esto abre Karma en el navegador y ejecuta los tests en modo watch (re-ejecuta al guardar).

Para una sola ejecución sin modo watch, cierra la ventana del navegador o presiona `Ctrl+C`.

### Specs disponibles

#### `autenticacion.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `iniciarSesion() llama POST /login` | Método HTTP correcto y URL |
| `registrar() llama POST /registro` | Método HTTP correcto y URL |
| `cerrarSesion() limpia el token del localStorage` | El token se elimina correctamente |

#### `cliente.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `listar() incluye parámetros de paginación` | Query params `pagina` y `tamanio` presentes |
| `crear() llama POST y retorna el cliente` | Método POST + mapeo de respuesta |
| `actualizar() llama PUT /{id}` | URL con ID correcto |
| `eliminar() llama DELETE /{id}` | Método DELETE correcto |

#### `pedido.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `listar() incluye parámetros de paginación` | Query params presentes |
| `listar() incluye filtros opcionales` | Filtros `estado` y `clienteId` en params |
| `crear() llama POST y retorna el pedido` | Método POST + mapeo |
| `cancelar() llama PATCH /cancelar` | URL y método correctos |
| `completar() llama PATCH /completar` | URL y método correctos |
| `editarDetalles() llama PUT /detalles con el cuerpo correcto` | Body `{ detalles }` y método PUT |
| `eliminar() llama DELETE` | Método DELETE correcto |

### Interpretar el output

```
Chrome Headless: Executed 15 of 15 SUCCESS (0.234 secs / 0.198 secs)
TOTAL: 15 SUCCESS
```

---

## Python — ServicioEstadisticas

El servicio de estadísticas no cuenta actualmente con tests unitarios automatizados.
El módulo `app/analizador.py` contiene toda la lógica de análisis de datos.

### Recomendación para tests futuros

Usar **pytest** con **pandas** directamente:

```bash
pip install pytest
```

Ejemplo de test a implementar:

```python
# tests/test_analizador.py
import pandas as pd
from app.analizador import analizar

def test_resumen_con_dataframe_vacio():
    df = pd.DataFrame(columns=['id', 'fechaCreacion', 'estado', 'total'])
    resultado = analizar(df, total_clientes=5)
    assert resultado['resumen']['totalPedidos'] == 0
    assert resultado['resumen']['totalClientes'] == 5

def test_resumen_cuenta_estados_correctamente():
    df = pd.DataFrame([
        {'id': '1', 'fechaCreacion': '2026-01-01', 'estado': 'ENTREGADO', 'total': 100},
        {'id': '2', 'fechaCreacion': '2026-01-02', 'estado': 'CANCELADO', 'total': 50},
        {'id': '3', 'fechaCreacion': '2026-01-03', 'estado': 'CONFIRMADO', 'total': 75},
    ])
    resultado = analizar(df, total_clientes=3)
    assert resultado['resumen']['completados'] == 1
    assert resultado['resumen']['cancelados'] == 1
    assert resultado['resumen']['pendientesYConfirmados'] == 1
```

Ejecutar: `pytest tests/ -v` desde `backend/ServicioEstadisticas/`.
