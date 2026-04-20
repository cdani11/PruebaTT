# ServicioAutenticacion — C# .NET 8

## Descripción general

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

## Extender el servicio

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

## Pruebas unitarias

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
