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

---

## Pruebas unitarias — resumen

| Servicio | Framework | Comando | Tests |
|---|---|---|---|
| ServicioClientesPedidos (PHP) | PHPUnit 10 + Mockery | `./vendor/bin/phpunit tests/ --testdox` | 16 |
| ServicioAutenticacion (.NET) | xUnit + Moq + FluentAssertions | `dotnet test tests/ServicioAutenticacion.UnitTests` | 2 |
| frontend-angular | Jasmine + Karma | `npm test` | 15 |
| ServicioEstadisticas (Python) | — | sin tests (ver nota) | — |

Ver detalle completo de cada suite en el archivo del servicio correspondiente.
