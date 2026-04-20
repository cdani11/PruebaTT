# Pruebas Unitarias — Ejecución desde línea de comandos

## ServicioAutenticacion (.NET 8)

**Prerrequisito:** .NET 8 SDK instalado (`dotnet --version` debe mostrar `8.x.x`)

```bash
# Desde la raíz del repositorio
cd backend/ServicioAutenticacion

# Ejecutar todos los tests
dotnet test tests/ServicioAutenticacion.UnitTests/ServicioAutenticacion.UnitTests.csproj

# Con salida detallada
dotnet test tests/ServicioAutenticacion.UnitTests/ServicioAutenticacion.UnitTests.csproj --logger "console;verbosity=detailed"

# Ejecutar un test específico por nombre
dotnet test tests/ServicioAutenticacion.UnitTests/ServicioAutenticacion.UnitTests.csproj --filter "DisplayName~Registrar_RetornaToken"
```

**Tests existentes** (5 en total — clase `AutenticacionAppServiceTests`):

| Test | Qué verifica |
|---|---|
| `Registrar_LanzaExcepcion_CuandoCorreoYaExiste` | Registro rechazado si el correo ya está registrado |
| `Registrar_RetornaToken_CuandoDatosValidos` | Registro exitoso devuelve un `TokenDto` |
| `IniciarSesion_LanzaExcepcion_CuandoUsuarioNoExiste` | Login rechazado si el correo no existe |
| `IniciarSesion_LanzaExcepcion_CuandoClaveIncorrecta` | Login rechazado si la clave no coincide |
| `IniciarSesion_RetornaToken_CuandoCredencialesCorrectas` | Login exitoso devuelve un `TokenDto` |

> Los tests usan **xUnit + Moq + FluentAssertions**. No requieren base de datos ni servicios externos.

---

## ServicioClientesPedidos (PHP 8.3)

**Prerrequisitos (una sola vez):**

1. Instalar PHP 8.3 (solo el runtime, sin drivers de SQL Server ni Xdebug)
   - Windows: descargar zip desde https://windows.php.net/download/ (PHP 8.3 VS16 x64 TS) y agregar al `PATH`
2. Instalar Composer:
   ```bash
   winget install Composer.Composer
   ```
3. Instalar dependencias del proyecto:
   ```bash
   cd backend/ServicioClientesPedidos
   composer install
   ```

```bash
# Desde backend/ServicioClientesPedidos

# Ejecutar todos los tests
vendor/bin/phpunit

# Con salida legible
vendor/bin/phpunit --testdox

# Solo un archivo
vendor/bin/phpunit tests/Unit/ClienteTest.php
```

**Tests existentes** (4 clases en `tests/Unit/`):

| Archivo | Qué verifica |
|---|---|
| `ClienteTest.php` | Entidad de dominio `Cliente` |
| `ClienteAppServiceTest.php` | Servicio de aplicación de clientes |
| `PedidoTest.php` | Entidad de dominio `Pedido` |
| `PedidoNuevosTest.php` | Casos adicionales de `Pedido` |

> Los tests usan **PHPUnit 10.5 + Mockery**. No requieren base de datos ni servidor web.
