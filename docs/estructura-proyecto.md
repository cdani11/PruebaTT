# Estructura del Proyecto PruebaTT

## Visión general

PruebaTT es una aplicación web de gestión de clientes y pedidos construida con arquitectura
de microservicios. Cada servicio tiene una responsabilidad única y se comunica a través de HTTP.

```
┌─────────────────────────────────────────────────────────┐
│                   Angular 17 (puerto 4200)               │
│              Single Page Application (SPA)               │
└────────────┬─────────────┬─────────────┬────────────────┘
             │             │             │
             ▼             ▼             ▼
    ┌─────────────┐ ┌───────────┐ ┌───────────────┐
    │ Autenticac. │ │ Clientes/ │ │ Estadísticas  │
    │ .NET 8      │ │ Pedidos   │ │ Python FastAPI │
    │ Puerto 5001 │ │ PHP 8.2   │ │ Puerto 8001   │
    └──────┬──────┘ │ Puerto    │ └───────┬───────┘
           │        │ 8080      │         │
           │        └─────┬─────┘         │
           │              │               │ (solo lectura)
           ▼              ▼               ▼
    ┌─────────────────────────────────────────────┐
    │           SQL Server 2022 (puerto 1434)      │
    │   AutenticacionDb  │  ClientesPedidosDb      │
    └─────────────────────────────────────────────┘
```

---

## Árbol de directorios

```
PruebaTT/
│
├── docker-compose.yml          # Orquestación: 4 servicios + SQL Server
│
├── backend/
│   ├── ServicioAutenticacion/  # C# .NET 8 — Login y registro
│   │   ├── src/
│   │   │   ├── ServicioAutenticacion.Domain/
│   │   │   │   ├── Entidades/Usuario.cs
│   │   │   │   └── Repositorios/IUsuarioRepository.cs
│   │   │   ├── ServicioAutenticacion.Application/
│   │   │   │   ├── DTOs/           # InicioSesionDto, RegistroDto, TokenDto
│   │   │   │   ├── Contratos/      # IAutenticacionAppService
│   │   │   │   └── Servicios/AutenticacionAppService.cs
│   │   │   ├── ServicioAutenticacion.Infrastructure/
│   │   │   │   ├── Persistencia/AutenticacionDbContext.cs
│   │   │   │   ├── Repositorios/UsuarioRepository.cs
│   │   │   │   └── Seguridad/      # HasheadorClavesBcrypt, GeneradorTokenJwt
│   │   │   └── ServicioAutenticacion.Presentation/
│   │   │       ├── Controllers/AutenticacionController.cs
│   │   │       ├── Middleware/ManejadorExcepcionesMiddleware.cs
│   │   │       └── Program.cs
│   │   ├── tests/
│   │   │   └── ServicioAutenticacion.UnitTests/
│   │   │       └── AutenticacionAppServiceTests.cs
│   │   └── database/esquema.sql
│   │
│   ├── ServicioClientesPedidos/ # PHP 8.2 — CRUD de clientes y pedidos
│   │   ├── src/
│   │   │   ├── Domain/
│   │   │   │   ├── Cliente/        # Cliente.php, IClienteRepository.php
│   │   │   │   └── Pedido/         # Pedido.php, DetallePedido.php, EstadoPedido.php
│   │   │   ├── Application/
│   │   │   │   ├── Cliente/ClienteAppService.php
│   │   │   │   └── Pedido/PedidoAppService.php
│   │   │   ├── Infrastructure/
│   │   │   │   ├── Persistencia/ConexionSqlServer.php
│   │   │   │   └── Repositorios/   # ClienteRepository.php, PedidoRepository.php
│   │   │   └── Presentation/
│   │   │       ├── Bootstrap/Aplicacion.php    # Composición raíz + rutas
│   │   │       ├── Controllers/                # ClienteController, PedidoController
│   │   │       └── Http/           # Enrutador.php, Respuesta.php
│   │   ├── public/index.php        # Entry point HTTP
│   │   ├── tests/Unit/             # PHPUnit tests
│   │   └── database/esquema.sql
│   │
│   └── ServicioEstadisticas/   # Python FastAPI — Análisis de datos
│       ├── main.py             # App FastAPI, endpoints, CORS
│       ├── app/
│       │   ├── analizador.py   # pandas/numpy: métricas, series temporales
│       │   ├── repositorio.py  # Queries SQL Server
│       │   └── conexion.py     # Pool de conexiones pyodbc
│       └── requirements.txt
│
├── frontend/
│   └── frontend-angular/       # Angular 17 — SPA
│       └── src/app/
│           ├── core/
│           │   ├── guards/autenticacion.guard.ts
│           │   ├── interceptors/   # token.interceptor, errores.interceptor
│           │   ├── modelos/        # cliente.modelo, pedido.modelo, estadisticas.modelo
│           │   └── servicios/      # autenticacion, cliente, pedido, estadisticas
│           └── features/
│               ├── autenticacion/  # Login, Registro
│               └── panel/
│                   ├── layout/panel.layout.ts   # Sidebar + navbar
│                   └── paginas/                 # tablero, clientes, pedidos
│
└── docs/                       # Documentación técnica
```

---

## Detalle por servicio

### ServicioAutenticacion — C# .NET 8

**Puerto**: 5001 | **Base de datos**: `AutenticacionDb`

**Clean Architecture en .NET:**

| Capa | Proyecto | Responsabilidad |
|---|---|---|
| Domain | `ServicioAutenticacion.Domain` | Entidad `Usuario`, interfaz `IUsuarioRepository` |
| Application | `ServicioAutenticacion.Application` | `AutenticacionAppService`, DTOs, contratos |
| Infrastructure | `ServicioAutenticacion.Infrastructure` | EF Core DbContext, repositorio, BCrypt, JWT |
| Presentation | `ServicioAutenticacion.Presentation` | Controladores ASP.NET, middleware, DI config |

**Flujo de login** (`POST /api/v1/autenticacion/login`):
```
HTTP Request
    → ManejadorExcepcionesMiddleware
    → AutenticacionController.IniciarSesion()
    → AutenticacionAppService.IniciarSesionAsync()
        → UsuarioRepository.ObtenerPorCorreoAsync()  [EXEC sp_ObtenerUsuarioPorCorreo]
        → HasheadorClavesBcrypt.Verificar()
        → GeneradorTokenJwt.Generar()
    ← TokenDto { token }
HTTP Response 200
```

**Endpoints:**
- `POST /api/v1/autenticacion/login`
- `POST /api/v1/autenticacion/registro`

---

### ServicioClientesPedidos — PHP 8.2

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

### ServicioEstadisticas — Python FastAPI

**Puerto**: 8001 | **Base de datos**: `ClientesPedidosDb` (solo lectura)

**Estructura:**

| Archivo | Responsabilidad |
|---|---|
| `main.py` | App FastAPI, CORS, definición de endpoints |
| `app/conexion.py` | Pool de conexiones pyodbc a SQL Server |
| `app/repositorio.py` | Queries SQL: pedidos y total de clientes |
| `app/analizador.py` | Análisis con pandas/numpy: resumen, series temporales, actividad mensual |

**Flujo** (`GET /api/v1/estadisticas`):
```
HTTP Request
    → main.py → obtener_estadisticas()
    → repositorio.obtener_pedidos()      [SELECT sobre Pedidos + PedidoDetalles]
    → repositorio.total_clientes()       [COUNT sobre Clientes]
    → analizador.analizar(df, n_clientes)
        → _preparar(df)                  [pandas: parse fechas, tipos]
        → _resumen(df)                   [value_counts por estado]
        → _actividad_diaria(df)          [groupby fecha + rolling(7).mean()]
        → _actividad_mensual(df)         [dt.to_period("M") + groupby]
    ← dict JSON serializable
HTTP Response 200
```

**Endpoints:**
- `GET /api/v1/estadisticas`
- `GET /health`

---

### frontend-angular — Angular 17

**Puerto**: 4200 | Comunica con los 3 backends.

**Estructura de `src/app/`:**

| Directorio | Contenido |
|---|---|
| `core/guards/` | `autenticacion.guard.ts` — protege rutas que requieren login |
| `core/interceptors/` | `token.interceptor.ts` — adjunta Bearer JWT a cada petición |
|  | `errores.interceptor.ts` — redirige al login si recibe 401 |
| `core/modelos/` | Interfaces TypeScript: `Cliente`, `Pedido`, `Estadisticas`, etc. |
| `core/servicios/` | `ClienteServicio`, `PedidoServicio`, `EstadisticasServicio`, `AutenticacionServicio` |
| `features/autenticacion/` | Páginas de Login y Registro |
| `features/panel/` | Layout del panel + páginas: Tablero, Clientes, Pedidos |

**Flujo de autenticación:**
```
Usuario escribe credenciales
    → InicioSesionComponente
    → AutenticacionServicio.iniciarSesion()
    → POST http://localhost:5001/api/v1/autenticacion/login
    ← { token: "eyJ..." }
    → localStorage.setItem('token', ...)
    → Router.navigate(['/panel'])

Petición posterior (ej. GET /clientes):
    → HttpClient (cualquier servicio)
    → token.interceptor.ts intercepta
        → lee localStorage.getItem('token')
        → clona la petición con header Authorization: Bearer eyJ...
    → Backend valida el JWT
```

---

## Formato estándar de respuesta API

Todos los endpoints (PHP y .NET) responden con:

```json
{
  "exito": true,
  "datos": { ... },
  "errores": []
}
```

En caso de error:

```json
{
  "exito": false,
  "datos": null,
  "errores": ["Mensaje descriptivo del error"]
}
```

Códigos HTTP utilizados:
- `200` — éxito con datos
- `201` — recurso creado
- `204` — éxito sin cuerpo (DELETE)
- `400` — error de validación de dominio
- `401` — no autenticado
- `404` — recurso no encontrado
- `500` — error interno

---

## Variables de entorno y Docker Compose

```yaml
# docker-compose.yml — servicios relevantes

servicio-autenticacion:
  environment:
    - ConnectionStrings__AutenticacionDb=Server=sqlserver,1433;...
    - Jwt__Clave=CLAVE_SECRETA_32_CARACTERES
    - Jwt__Emisor=ServicioAutenticacion
    - Jwt__Audiencia=PruebaTT

servicio-clientes-pedidos:
  environment:
    - DB_SERVIDOR=sqlserver
    - DB_NOMBRE=ClientesPedidosDb
    - DB_USUARIO=sa
    - DB_CLAVE=TuClaveFuerte123!
    - JWT_CLAVE=CLAVE_SECRETA_32_CARACTERES   # Para validar el token

servicio-estadisticas:
  environment:
    - DB_SERVIDOR=sqlserver,1433
    - DB_NOMBRE=ClientesPedidosDb
    - DB_USUARIO=sa
    - DB_CLAVE=TuClaveFuerte123!
```

**Nota de seguridad**: en producción, las claves deben gestionarse con Docker Secrets
o un servicio de gestión de secretos (Azure Key Vault, AWS Secrets Manager, etc.).

---

## Bases de datos

### AutenticacionDb

```sql
Usuarios (Id, NombreUsuario, CorreoElectronico, ClaveHash, FechaCreacion, Activo)
```

Stored Procedures: `sp_AgregarUsuario`, `sp_ObtenerUsuarioPorCorreo`,
`sp_ObtenerUsuarioPorId`, `sp_ExisteCorreo`

### ClientesPedidosDb

```sql
Clientes    (Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo)
Pedidos     (Id, ClienteId, FechaCreacion, Estado, Total)
PedidoDetalles (Id, PedidoId, Producto, Cantidad, PrecioUnitario)
```

Stored Procedures: `sp_AgregarCliente`, `sp_ListarClientes`, `sp_ActualizarCliente`,
`sp_EliminarCliente`, `sp_AgregarPedido`, `sp_ListarPedidos`, `sp_EliminarDetallesPedido`,
`sp_ActualizarPedido`, `sp_EliminarPedido`, y otros.
