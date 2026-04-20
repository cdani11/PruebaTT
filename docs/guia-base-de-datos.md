# Guía: Levantar SQL Server y ejecutar los scripts

## Requisitos previos

- Docker Desktop instalado y corriendo
- Terminal en la raíz del proyecto (`PruebaTT/`)

---

## 1. Levantar solo SQL Server

No es necesario levantar todos los servicios para ejecutar los scripts.
Solo levanta el contenedor de SQL Server:

```bash
docker compose up sqlserver -d
```

Verifica que está corriendo:

```bash
docker ps
```

Deberías ver `pruebatt-sqlserver` con estado `Up`.

---

## 2. Esperar que SQL Server esté listo

SQL Server tarda unos segundos en iniciar. Espera hasta que los logs muestren que está listo:

```bash
docker logs pruebatt-sqlserver --follow
```

Cuando veas esta línea, ya está listo:

```
SQL Server is now ready for client connections.
```

Presiona `Ctrl + C` para salir del log.

---

## 3. Ejecutar el esquema de AutenticacionDb

```bash
docker exec -i pruebatt-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "TuClaveFuerte123!" \
  -No -C \
  -i /dev/stdin < backend/ServicioAutenticacion/database/esquema.sql
```

> **¿Qué hace?** Crea la base de datos `AutenticacionDb`, la tabla `Usuarios` y los 4 stored procedures de autenticación.

---

## 4. Ejecutar el esquema de ClientesPedidosDb

```bash
docker exec -i pruebatt-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "TuClaveFuerte123!" \
  -No -C \
  -i /dev/stdin < backend/ServicioClientesPedidos/database/esquema.sql
```

> **¿Qué hace?** Crea la base de datos `ClientesPedidosDb`, las tablas `Clientes`, `Pedidos`, `PedidoDetalles` y los 12 stored procedures.

---

## 5. Verificar que los SPs existen (opcional)

Conéctate al contenedor y consulta los procedimientos creados:

```bash
docker exec -it pruebatt-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "TuClaveFuerte123!" -No -C
```

Dentro del prompt de sqlcmd:

```sql
-- Verificar SPs de AutenticacionDb
USE AutenticacionDb;
SELECT name FROM sys.procedures ORDER BY name;
GO

-- Verificar SPs de ClientesPedidosDb
USE ClientesPedidosDb;
SELECT name FROM sys.procedures ORDER BY name;
GO

-- Salir
EXIT
```

---

## 6. Levantar todos los servicios

Una vez ejecutados los scripts, levanta el stack completo:

```bash
docker compose up -d
```

Servicios disponibles:

| Servicio | URL |
|---------|-----|
| SQL Server (Docker) | `localhost:1434` |
| Autenticación (.NET) | `http://localhost:5001` |
| Clientes/Pedidos (PHP) | `http://localhost:8080` |
| Swagger Autenticación | `http://localhost:5001/swagger` |

---

## Comandos útiles

```bash
# Ver logs de un servicio
docker logs pruebatt-autenticacion --follow
docker logs pruebatt-clientes-pedidos --follow
docker logs pruebatt-sqlserver --follow

# Detener todo
docker compose down

# Detener y borrar los datos de la BD (volumen)
docker compose down -v

# Reiniciar un servicio
docker compose restart servicio-autenticacion

# Ver estado de todos los contenedores
docker compose ps
```

---

## Credenciales SQL Server

| Campo | Valor |
|-------|-------|
| Servidor | `localhost,1434` |
| Usuario | `sa` |
| Contraseña | `TuClaveFuerte123!` |
| BD Auth | `AutenticacionDb` |
| BD Clientes/Pedidos | `ClientesPedidosDb` |

> Cambia la contraseña en `docker-compose.yml` y `appsettings.json` antes de ir a producción.

---

## Orden correcto al iniciar el proyecto por primera vez

```
1. docker compose up sqlserver -d
2. (esperar que SQL Server esté listo ~15 segundos)
3. Ejecutar esquema de AutenticacionDb (paso 3)
4. Ejecutar esquema de ClientesPedidosDb (paso 4)
5. docker compose up -d
```
