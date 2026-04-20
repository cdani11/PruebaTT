# ServicioClientesPedidos — PHP 8.2

## Descripción general

**Puerto**: 8080 | **Base de datos**: `ClientesPedidosDb`

**Clean Architecture en PHP (manual, sin framework):**

| Capa | Directorio | Responsabilidad |
|---|---|---|
| Domain | `src/Domain/` | Entidades, interfaces de repositorio, excepciones de dominio |
| Application | `src/Application/` | App services, orquestación de casos de uso |
| Infrastructure | `src/Infrastructure/` | Repositorios PDO, conexión SQL Server |
| Presentation | `src/Presentation/` | Controladores, enrutador, serialización de respuestas |

**Flujo de crear cliente** (`POST /api/v1/clientes`):
```
HTTP Request
    → public/index.php
    → Aplicacion::ejecutar()
        → Headers CORS
        → Enrutador::despachar('POST', '/api/v1/clientes')
        → ClienteController::crear($args, $cuerpo, $query)
        → ClienteAppService::crearCliente($datos)
            → ClienteRepository::existeCorreo()   [EXEC sp_ExisteCorreoCliente]
            → Cliente::crear()
            → ClienteRepository::agregar()        [EXEC sp_AgregarCliente]
        ← Cliente creado
    ← Respuesta::exito($datos, 201)
HTTP Response 201
```

**Endpoints disponibles:**
```
POST   /api/v1/clientes
GET    /api/v1/clientes?pagina=1&tamanio=20
GET    /api/v1/clientes/{id}
PUT    /api/v1/clientes/{id}
DELETE /api/v1/clientes/{id}

POST   /api/v1/pedidos
GET    /api/v1/pedidos?pagina=1&tamanio=20&estado=CONFIRMADO
PUT    /api/v1/pedidos/{id}/detalles
PATCH  /api/v1/pedidos/{id}/cancelar
PATCH  /api/v1/pedidos/{id}/completar
DELETE /api/v1/pedidos/{id}
```

**Estados de un pedido:**
```
PENDIENTE → (agregar detalles) → confirmar() → CONFIRMADO
CONFIRMADO → completar() → ENTREGADO
CONFIRMADO → cancelar() → CANCELADO
PENDIENTE  → cancelar() → CANCELADO
```

---

## Extender el servicio

### Ejemplo: agregar la entidad `Categoria`

Supongamos que queremos asociar categorías a los productos de los pedidos.

#### 1. Stored Procedure en SQL Server

Añadir al final de `backend/ServicioClientesPedidos/database/esquema.sql`:

```sql
-- Tabla
CREATE TABLE Categorias (
    Id      NVARCHAR(50)  NOT NULL PRIMARY KEY,
    Nombre  NVARCHAR(100) NOT NULL,
    Activo  BIT           NOT NULL DEFAULT 1
);
GO

-- SPs
CREATE OR ALTER PROCEDURE sp_AgregarCategoria
    @Id NVARCHAR(50), @Nombre NVARCHAR(100)
AS BEGIN
    SET NOCOUNT ON;
    INSERT INTO Categorias (Id, Nombre) VALUES (@Id, @Nombre);
END
GO

CREATE OR ALTER PROCEDURE sp_ListarCategorias
AS BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre FROM Categorias WHERE Activo = 1;
END
GO
```

Ejecutar en el contenedor SQL Server:

```bash
docker exec pruebatt-sqlserver bash -c \
  "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'TuClaveFuerte123!' \
   -C -No -d ClientesPedidosDb -i /ruta/esquema.sql"
```

#### 2. Entidad de dominio

Crear `src/Domain/Categoria/Categoria.php`:

```php
<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Categoria;

use PruebaTT\ClientesPedidos\Domain\Excepciones\DominioExcepcion;

final class Categoria
{
    private function __construct(
        private string $id,
        private string $nombre
    ) {}

    public static function crear(string $nombre): self
    {
        if (trim($nombre) === '') {
            throw new DominioExcepcion('El nombre de la categoría es obligatorio.');
        }
        return new self(id: bin2hex(random_bytes(16)), nombre: trim($nombre));
    }

    public function id(): string     { return $this->id; }
    public function nombre(): string { return $this->nombre; }
}
```

#### 3. Interface del repositorio

Crear `src/Domain/Categoria/ICategoriaRepository.php`:

```php
<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Domain\Categoria;

interface ICategoriaRepository
{
    public function agregar(Categoria $categoria): void;
    /** @return Categoria[] */
    public function listar(): array;
}
```

#### 4. Implementación del repositorio

Crear `src/Infrastructure/Repositorios/CategoriaRepository.php`:

```php
<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Infrastructure\Repositorios;

use PruebaTT\ClientesPedidos\Domain\Categoria\Categoria;
use PruebaTT\ClientesPedidos\Domain\Categoria\ICategoriaRepository;
use PruebaTT\ClientesPedidos\Infrastructure\Persistencia\ConexionSqlServer;

final class CategoriaRepository implements ICategoriaRepository
{
    public function __construct(private ConexionSqlServer $conexion) {}

    public function agregar(Categoria $categoria): void
    {
        $stmt = $this->conexion->obtener()->prepare(
            'EXEC sp_AgregarCategoria :Id, :Nombre'
        );
        $stmt->execute([':Id' => $categoria->id(), ':Nombre' => $categoria->nombre()]);
    }

    public function listar(): array
    {
        $stmt = $this->conexion->obtener()->prepare('EXEC sp_ListarCategorias');
        $stmt->execute();
        // Mapear filas a objetos de dominio (usando reflexión o factory estática)
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
```

#### 5. App Service

Crear `src/Application/Categoria/CategoriaAppService.php`:

```php
<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Application\Categoria;

use PruebaTT\ClientesPedidos\Domain\Categoria\Categoria;
use PruebaTT\ClientesPedidos\Domain\Categoria\ICategoriaRepository;

final class CategoriaAppService
{
    public function __construct(private ICategoriaRepository $categorias) {}

    public function crearCategoria(array $datos): Categoria
    {
        $categoria = Categoria::crear($datos['nombre'] ?? '');
        $this->categorias->agregar($categoria);
        return $categoria;
    }

    public function listarCategorias(): array
    {
        return $this->categorias->listar();
    }
}
```

#### 6. Controller

Crear `src/Presentation/Controllers/CategoriaController.php`:

```php
<?php
declare(strict_types=1);

namespace PruebaTT\ClientesPedidos\Presentation\Controllers;

use PruebaTT\ClientesPedidos\Application\Categoria\CategoriaAppService;
use PruebaTT\ClientesPedidos\Presentation\Http\Respuesta;

final class CategoriaController
{
    public function __construct(private CategoriaAppService $servicio) {}

    public function crear(array $_args, array $cuerpo, array $_query): void
    {
        $categoria = $this->servicio->crearCategoria($cuerpo);
        Respuesta::exito(['id' => $categoria->id(), 'nombre' => $categoria->nombre()], 201);
    }

    public function listar(array $_args, array $_cuerpo, array $_query): void
    {
        Respuesta::exito($this->servicio->listarCategorias());
    }
}
```

#### 7. Registrar rutas

En `src/Presentation/Bootstrap/Aplicacion.php`, agregar dentro del bloque `try`:

```php
$categoriaRepo = new CategoriaRepository($conexion);
$categoriaCtrl = new CategoriaController(new CategoriaAppService($categoriaRepo));

$enrutador->registrar('POST', '/api/v1/categorias',  [$categoriaCtrl, 'crear']);
$enrutador->registrar('GET',  '/api/v1/categorias',  [$categoriaCtrl, 'listar']);
```

#### 8. Reconstruir el contenedor

```bash
docker compose build servicio-clientes-pedidos
docker compose up -d servicio-clientes-pedidos
```

---

## Pruebas unitarias

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
