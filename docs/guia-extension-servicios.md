# Guía para Extender los Servicios

Esta guía muestra cómo agregar nueva funcionalidad a cada servicio siguiendo
los patrones ya establecidos en el proyecto. La regla general es siempre partir
desde la base de datos hacia arriba: **BD → Dominio → Infraestructura → Aplicación → Presentación → Frontend**.

---

## PHP — ServicioClientesPedidos

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

## .NET — ServicioAutenticacion

### Ejemplo: agregar endpoint `cambiarClave`

#### 1. DTO en Application

Crear `src/ServicioAutenticacion.Application/DTOs/CambiarClaveDto.cs`:

```csharp
namespace ServicioAutenticacion.Application.DTOs;

public record CambiarClaveDto(string ClaveActual, string ClaveNueva);
```

#### 2. Contrato en la interfaz de servicio

En `src/ServicioAutenticacion.Application/Contratos/IAutenticacionAppService.cs`:

```csharp
Task CambiarClaveAsync(Guid usuarioId, CambiarClaveDto dto, CancellationToken ct = default);
```

#### 3. Implementación en el App Service

En `src/ServicioAutenticacion.Application/Servicios/AutenticacionAppService.cs`:

```csharp
public async Task CambiarClaveAsync(Guid usuarioId, CambiarClaveDto dto, CancellationToken ct = default)
{
    var usuario = await _repo.ObtenerPorIdAsync(usuarioId, ct)
        ?? throw new Exception("Usuario no encontrado.");

    if (!_hasheador.Verificar(dto.ClaveActual, usuario.ClaveHash))
        throw new Exception("La clave actual no es correcta.");

    var nuevoHash = _hasheador.Hashear(dto.ClaveNueva);
    // Actualizar en repositorio (agregar método ActualizarClaveAsync)
}
```

#### 4. Acción en el Controller

En `src/ServicioAutenticacion.Presentation/Controllers/AutenticacionController.cs`:

```csharp
[HttpPatch("cambiar-clave")]
[Authorize]
public async Task<IActionResult> CambiarClave(
    [FromBody] CambiarClaveDto dto,
    CancellationToken ct)
{
    var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    await _servicio.CambiarClaveAsync(usuarioId, dto, ct);
    return Ok(new { exito = true, datos = (object?)null, errores = Array.Empty<string>() });
}
```

#### 5. Reconstruir

```bash
docker compose build servicio-autenticacion
docker compose up -d servicio-autenticacion
```

---

## Angular — frontend-angular

### Ejemplo: agregar la página de Categorías

#### 1. Modelo

Crear `src/app/core/modelos/categoria.modelo.ts`:

```typescript
export interface Categoria {
  id: string;
  nombre: string;
}

export interface CrearCategoriaDto {
  nombre: string;
}
```

#### 2. Servicio

Crear `src/app/core/servicios/categoria.servicio.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api.modelo';
import { Categoria, CrearCategoriaDto } from '../modelos/categoria.modelo';

@Injectable({ providedIn: 'root' })
export class CategoriaServicio {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiClientesPedidos}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http
      .get<RespuestaApi<Categoria[]>>(this.base)
      .pipe(map(r => r.datos ?? []));
  }

  crear(dto: CrearCategoriaDto): Observable<Categoria> {
    return this.http
      .post<RespuestaApi<Categoria>>(this.base, dto)
      .pipe(map(r => r.datos!));
  }
}
```

#### 3. Componente

Crear `src/app/features/panel/paginas/categorias.componente.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CategoriaServicio } from '../../../core/servicios/categoria.servicio';
import { Categoria } from '../../../core/modelos/categoria.modelo';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <h1 class="mb-6 text-2xl font-bold text-gray-800">Categorías</h1>
      <!-- tabla y modal aquí, siguiendo el patrón de clientes.componente.ts -->
    </div>
  `
})
export class CategoriasComponente implements OnInit {
  private readonly svc = inject(CategoriaServicio);
  categorias = signal<Categoria[]>([]);

  ngOnInit(): void {
    this.svc.listar().subscribe(lista => this.categorias.set(lista));
  }
}
```

#### 4. Ruta lazy

En `src/app/features/panel/panel.routes.ts`, agregar:

```typescript
{
  path: 'categorias',
  loadComponent: () =>
    import('./paginas/categorias.componente').then(m => m.CategoriasComponente),
}
```

#### 5. Enlace en el layout

En `src/app/features/panel/layout/panel.layout.ts`, agregar al array de navegación:

```typescript
{ ruta: '/panel/categorias', etiqueta: 'Categorías', icono: '🏷️' }
```

---

## Python — ServicioEstadisticas

### Ejemplo: agregar métrica "ticket promedio por mes"

#### 1. Nueva función en `app/analizador.py`

```python
def _ticket_promedio_mensual(df: pd.DataFrame) -> list[dict]:
    """Ticket promedio (total/pedido) agrupado por mes."""
    activos = df[df["estado"] != "CANCELADO"].copy()
    if activos.empty:
        return []

    activos["mes"] = pd.to_datetime(activos["fecha"]).dt.to_period("M")

    resultado = (
        activos
        .groupby("mes")["total"]
        .mean()
        .round(2)
        .reset_index()
        .tail(6)
    )

    return [
        {"mes": str(r["mes"]), "ticketPromedio": _f(float(r["total"]))}
        for _, r in resultado.iterrows()
    ]
```

#### 2. Incluir en `analizar()`

```python
def analizar(df: pd.DataFrame, total_clientes: int) -> dict:
    # ...código existente...
    return {
        "resumen":               _resumen(df, total_clientes),
        "actividadDiaria":       _actividad_diaria(df),
        "actividadMensual":      _actividad_mensual(df),
        "ticketPromedioMensual": _ticket_promedio_mensual(df),  # ← nuevo
    }
```

#### 3. Actualizar el modelo en Angular

En `src/app/core/modelos/estadisticas.modelo.ts`:

```typescript
export interface TicketMensual {
  mes: string;
  ticketPromedio: number;
}

export interface Estadisticas {
  resumen: ResumenEstadisticas;
  actividadDiaria: PuntoDiario[];
  actividadMensual: PuntoMensual[];
  ticketPromedioMensual: TicketMensual[];  // ← nuevo
}
```

#### 4. Reconstruir

```bash
docker compose build servicio-estadisticas
docker compose up -d servicio-estadisticas
```

---

## Convenciones a respetar

| Aspecto | Convención |
|---|---|
| Nombres de entidades y casos de uso | Español (ej. `Cliente`, `PedidoAppService`) |
| Nombres de infraestructura y config | Inglés o mixto (ej. `ConexionSqlServer`, `docker-compose.yml`) |
| Métodos de dominio | Verbos en español: `crear()`, `confirmar()`, `cancelar()` |
| Respuesta HTTP | Siempre `{ exito, datos, errores }` |
| Stored Procedures | Prefijo `sp_` + acción + entidad: `sp_AgregarCliente` |
| Componentes Angular | Sufijo `Componente` en PascalCase, selector `app-` en kebab |
| Servicios Angular | Sufijo `Servicio`, `providedIn: 'root'` |
