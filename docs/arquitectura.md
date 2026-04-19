# Arquitectura

## Principios

- Clean Architecture por microservicio (domain, application, infrastructure, presentation)
- SOLID, DRY, POO, AOP donde aplique
- Una base de datos por microservicio (no compartir esquemas)
- Comunicación REST entre servicios y con el frontend

## Capas

**domain**: entidades, value objects, interfaces de repositorio, excepciones de dominio. Sin dependencias externas.

**application**: casos de uso, DTOs, servicios de aplicación, orquestación. Depende solo de `domain`.

**infrastructure**: implementaciones concretas (EF Core, PDO, JWT, repositorios, adaptadores). Depende de `domain` y `application`.

**presentation**: controladores HTTP, middleware, configuración de DI, Swagger. Depende de `application` e `infrastructure` (solo para composición).

## Flujo de dependencias

```
presentation -> application -> domain
      |             |
      v             v
infrastructure -----+
```

## Respuesta estándar

```json
{ "exito": boolean, "datos": any, "errores": string[] }
```

## Versionado

Todas las rutas van bajo `/api/v1/...`. Cambios incompatibles incrementan la versión.
