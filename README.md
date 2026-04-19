# PruebaTT

Solución de microservicios con Clean Architecture.

## Estructura

```
PruebaTT/
├── backend/
│   ├── ServicioAutenticacion/       # .NET 8 - JWT, registro, login
│   └── ServicioClientesPedidos/     # PHP 8 - gestión de clientes y pedidos
├── frontend/
│   └── frontend-angular/            # Angular 17 + Tailwind
├── docs/
│   └── arquitectura.md
└── docker-compose.yml               # SQL Server + servicios
```

## Stack

- **Autenticación**: .NET 8, EF Core, JWT, SQL Server
- **Clientes/Pedidos**: PHP 8, PDO, SQL Server
- **Frontend**: Angular 17, Tailwind, RxJS
- **DB**: SQL Server (una BD por microservicio)
- **Comunicación**: REST, APIs versionadas (`/api/v1`)

## Respuesta estándar de APIs

```json
{
  "exito": true,
  "datos": {},
  "errores": []
}
```

## Arranque rápido

```bash
docker-compose up -d        # levanta SQL Server + servicios
cd frontend/frontend-angular && npm install && npm start
```
