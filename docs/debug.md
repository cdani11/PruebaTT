# Plan: Configurar depuración local en VS Code

## Context
El proyecto tiene 3 servicios backend sin carpeta `.vscode`. Se necesita crear `launch.json` y `tasks.json` para poder depurar cada servicio desde VS Code con breakpoints. La base de datos SQL Server se levanta desde Docker; los servicios corren localmente.

---

## Prerrequisitos

### Todos los servicios
```bash
# Levantar solo SQL Server (ya expuesto en localhost,1434 por docker-compose)
docker-compose up sqlserver -d
```

### ServicioAutenticacion (.NET 8)
```bash
winget install Microsoft.DotNet.SDK.8
cd backend/ServicioAutenticacion && dotnet restore ServicioAutenticacion.sln
```
No requiere archivo `.env` — `appsettings.json` ya apunta a `localhost,1434`.

### ServicioClientesPedidos (PHP 8.3)
1. Instalar PHP 8.3 TS x64 desde https://windows.php.net/download/ → extraer en `C:\php83` → agregar al `PATH`
2. Instalar **ODBC Driver 18 for SQL Server** (x64) desde Microsoft
3. Bajar `php_sqlsrv_83_ts_x64.dll` y `php_pdo_sqlsrv_83_ts_x64.dll` → copiar a `C:\php83\ext\`
4. En `C:\php83\php.ini` (copiar de `php.ini-development`) agregar:
   ```ini
   extension_dir = "C:\php83\ext"
   extension=pdo
   extension=openssl
   extension=php_sqlsrv_83_ts_x64
   extension=php_pdo_sqlsrv_83_ts_x64

   [xdebug]
   zend_extension=php_xdebug-3.x.x-8.3-vs16-x86_64   ; nombre exacto del DLL descargado
   xdebug.mode=debug
   xdebug.start_with_request=yes
   xdebug.client_host=127.0.0.1
   xdebug.client_port=9003
   xdebug.log_level=0
   ```
5. Descargar Xdebug en https://xdebug.org/wizard usando salida de `php -i`
6. `winget install Composer.Composer` luego `composer install` en la carpeta del servicio
7. Crear `backend/ServicioClientesPedidos/.env`:
   ```
   DB_SERVIDOR=localhost,1434
   DB_NOMBRE=ClientesPedidosDb
   DB_USUARIO=sa
   DB_CLAVE=TuClaveFuerte123!
   JWT_CLAVE=CAMBIA_ESTA_CLAVE_POR_UNA_SECRETA_DE_AL_MENOS_32_CARACTERES
   ```

### ServicioEstadisticas (Python 3.11)
```bash
winget install Python.Python.3.11
cd backend/ServicioEstadisticas
python -m venv .venv
.venv\Scripts\activate && pip install -r requirements.txt
```
Crear `backend/ServicioEstadisticas/.env`:
```
DB_SERVIDOR=localhost,1434
DB_NOMBRE=ClientesPedidosDb
DB_USUARIO=sa
DB_CLAVE=TuClaveFuerte123!
```

### Extensiones VS Code
```bash
code --install-extension ms-dotnettools.csdevkit
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension xdebug.php-debug
code --install-extension bmewburn.vscode-intelephense-client
code --install-extension ms-azuretools.vscode-docker
```

---

## Archivos a crear

### `.vscode/tasks.json`
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build: ServicioAutenticacion",
      "type": "process",
      "command": "dotnet",
      "args": [
        "build",
        "${workspaceFolder}/backend/ServicioAutenticacion/ServicioAutenticacion.sln",
        "--configuration", "Debug",
        "--no-restore"
      ],
      "group": { "kind": "build", "isDefault": true },
      "presentation": { "reveal": "silent", "panel": "shared" },
      "problemMatcher": "$msCompile"
    }
  ]
}
```

### `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug: ServicioAutenticacion (.NET)",
      "type": "dotnet",
      "request": "launch",
      "projectPath": "${workspaceFolder}/backend/ServicioAutenticacion/src/ServicioAutenticacion.Presentation/ServicioAutenticacion.Presentation.csproj",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_URLS": "http://localhost:5001"
      },
      "preLaunchTask": "Build: ServicioAutenticacion",
      "stopAtEntry": false,
      "console": "internalConsole"
    },
    {
      "name": "Debug: ServicioClientesPedidos (PHP)",
      "type": "php",
      "request": "launch",
      "runtimeExecutable": "php",
      "runtimeArgs": [
        "-S", "localhost:8080",
        "-t", "${workspaceFolder}/backend/ServicioClientesPedidos/public"
      ],
      "program": "${workspaceFolder}/backend/ServicioClientesPedidos/public/index.php",
      "cwd": "${workspaceFolder}/backend/ServicioClientesPedidos",
      "port": 9003,
      "stopOnEntry": false
    },
    {
      "name": "Debug: ServicioEstadisticas (Python/FastAPI)",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"],
      "cwd": "${workspaceFolder}/backend/ServicioEstadisticas",
      "envFile": "${workspaceFolder}/backend/ServicioEstadisticas/.env",
      "python": "${workspaceFolder}/backend/ServicioEstadisticas/.venv/Scripts/python.exe",
      "console": "integratedTerminal",
      "justMyCode": true
    }
  ],
  "compounds": [
    {
      "name": "Debug: Todos los servicios",
      "configurations": [
        "Debug: ServicioAutenticacion (.NET)",
        "Debug: ServicioClientesPedidos (PHP)",
        "Debug: ServicioEstadisticas (Python/FastAPI)"
      ],
      "stopAll": true
    }
  ]
}
```

---

## Notas de diseño

- **PHP usa el servidor integrado** (`php -S`) en lugar de Apache — sin configuración de servidor web en Windows. El `cwd` apunta a la raíz del servicio para que `phpdotenv` encuentre el `.env`.
- **Python usa `"module": "uvicorn"`** (no `"program"`) para que `debugpy` pueda interceptar los handlers de FastAPI. Con `--reload` los cambios se aplican sin reiniciar la sesión de depuración.
- **El compound `Debug: Todos los servicios`** lanza los 3 depuradores simultáneamente con F5 desde el panel Run & Debug.
- Los puertos coinciden con los puertos externos del `docker-compose.yml` (`5001`, `8080`, `8001`) para que el frontend funcione igual.

---

## Archivos críticos

| Acción | Archivo |
|--------|---------|
| Crear | `.vscode/launch.json` |
| Crear | `.vscode/tasks.json` |
| Crear | `backend/ServicioClientesPedidos/.env` |
| Crear | `backend/ServicioEstadisticas/.env` |
| Referencia (sin cambios) | `backend/ServicioAutenticacion/src/ServicioAutenticacion.Presentation/appsettings.json` |

---

## Verificación

1. `docker inspect pruebatt-sqlserver --format='{{.State.Health.Status}}'` → debe imprimir `healthy`
2. Abrir VS Code en la raíz: `code C:\Users\CDani\source\repos\PruebaTT`
3. Ctrl+Shift+D → seleccionar cada configuración y presionar F5
4. Poner un breakpoint en `Program.cs`, en `index.php` o en `main.py` y hacer una petición HTTP para verificar que se detiene