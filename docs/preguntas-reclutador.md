# Preguntas de Reclutador — Preparación para Entrevista Técnica

Este documento simula las preguntas más frecuentes en una entrevista técnica para este proyecto,
las respuestas orientativas, y un conjunto de nuevas funcionalidades propuestas con instrucciones
detalladas de implementación.

---

## Sección A — Preguntas Técnicas

### 1. ¿Por qué usaste Clean Architecture en lugar de un MVC tradicional?

**Respuesta orientativa:**

Clean Architecture separa el código en capas con dependencias que apuntan siempre
hacia el dominio. Esto permite que las reglas de negocio no dependan de la base de datos,
del framework HTTP ni de ninguna librería externa.

En la práctica, esto significó que pude cambiar cómo se ejecutan los stored procedures
(de `FirstOrDefaultAsync` a `ToListAsync`) sin tocar ninguna lógica de negocio.
También hice tests unitarios del dominio sin necesitar una base de datos real —
los tests de `PedidoTest.php` y `AutenticacionAppServiceTests.cs` prueban reglas de negocio
puras usando mocks.

Con MVC tradicional, la lógica de negocio suele estar acoplada al controlador o al ORM,
lo que hace difícil testear y evolucionar el sistema sin efectos secundarios.

---

### 2. ¿Cómo fluye la autenticación JWT entre los servicios?

**Respuesta orientativa:**

El usuario hace login en `ServicioAutenticacion` (puerto 5001), que valida credenciales
con BCrypt y devuelve un JWT firmado. El token contiene el ID y correo del usuario.

El frontend guarda el token en `localStorage` y el interceptor `token.interceptor.ts`
lo adjunta automáticamente en el header `Authorization: Bearer ...` de cada petición.

`ServicioClientesPedidos` (PHP) valida el JWT localmente con `firebase/php-jwt`
usando la misma clave secreta configurada en la variable de entorno `JWT_CLAVE`.
No hay llamada al servicio de autenticación en cada request — el token es autocontenido
y verificable sin red.

---

### 3. ¿Por qué usaste Stored Procedures en lugar de ORM directo?

**Respuesta orientativa:**

La prueba técnica lo requería. Pero más allá del requerimiento, los SPs tienen ventajas
concretas: la lógica de filtrado complejo (como los WHERE condicionales de `sp_ListarPedidos`
con `ISNULL`) es más legible y mantenible en SQL que en un query builder.
También permiten encapsular transacciones del lado del servidor, como en `sp_AgregarPedido`
que inserta cabecera y detalles en una sola transacción atómica.

La desventaja es que cambiar el esquema requiere coordinar cambios en SQL y en el código.
En .NET usé Entity Framework Core con `FromSqlRaw` para llamar los SPs, lo que añadió
una complejidad extra (el error de "non-composable SQL") que tuve que resolver
cargando los resultados con `ToListAsync()` antes de `FirstOrDefault()`.

---

### 4. ¿Cómo garantizas la consistencia entre las dos bases de datos?

**Respuesta orientativa:**

Actualmente no hay transacciones distribuidas entre `AutenticacionDb` y `ClientesPedidosDb`
porque los datos son independientes: autenticación gestiona usuarios y credenciales,
mientras que clientes/pedidos gestiona la lógica de negocio.

Un `ClienteId` en `ClientesPedidosDb` es un identificador de negocio propio, no una
clave foránea a `Usuarios`. Esto es una decisión de diseño: el microservicio de clientes
no depende del de autenticación.

Si el proyecto creciera y necesitara consistencia (por ejemplo, al eliminar un usuario
debe eliminarse también su cliente), usaría eventos de dominio o el patrón Saga:
el servicio de autenticación publicaría un evento `UsuarioEliminado` y el servicio de
clientes lo consumiría para ejecutar su propia acción.

---

### 5. ¿Qué cambiarías para llevarlo a producción?

**Respuesta orientativa:**

1. **Secretos**: las claves JWT y credenciales de BD deben estar en un gestor de secretos
   (Azure Key Vault, AWS Secrets Manager), no en variables de entorno de Docker.
2. **HTTPS**: habilitar TLS en todos los servicios. Actualmente el CORS permite cualquier origen.
3. **Logging centralizado**: agregar un stack como Seq o ELK para correlacionar logs entre microservicios.
4. **Health checks reales**: los endpoints `/health` deberían verificar conectividad a la BD.
5. **Rate limiting**: proteger los endpoints de login contra fuerza bruta.
6. **CI/CD**: pipeline que ejecute los tests antes de cada deploy.
7. **Paginación del cursor**: para tablas grandes, `OFFSET/FETCH` no escala bien; usar
   paginación basada en cursor.

---

## Sección B — Nuevas Funcionalidades Propuestas

### 1. Roles de usuario (Admin / Vendedor)

**Descripción:** Actualmente todos los usuarios autenticados tienen los mismos permisos.
Con roles, un `vendedor` solo puede ver y crear pedidos, mientras que un `admin`
puede eliminar clientes y ver el dashboard de estadísticas.

**Justificación técnica:** Es la extensión más natural del sistema de autenticación
existente. La clave JWT ya puede transportar claims adicionales.

**Qué se modifica:**
- `AutenticacionDb.Usuarios`: agregar columna `Rol NVARCHAR(20) NOT NULL DEFAULT 'vendedor'`
- `sp_AgregarUsuario` y `sp_ObtenerUsuarioPorCorreo`: incluir `Rol` en los parámetros/SELECT
- `AutenticacionAppService.cs`: incluir el rol como claim en el JWT generado
- `ServicioClientesPedidos`: middleware PHP que lee el claim `rol` del JWT y bloquea rutas
- Angular: `RolGuard` que verifica el rol antes de activar rutas del panel

---

### 2. Exportar reportes CSV desde el dashboard

**Descripción:** El dashboard muestra estadísticas pero no permite descargarlas.
Un botón "Exportar CSV" generaría un archivo descargable con los datos de actividad diaria.

**Justificación técnica:** Demuestra el uso de pandas para exportación de datos,
una operación común en proyectos de BI. `df.to_csv()` es trivial de implementar
una vez que el DataFrame ya está construido.

**Qué se modifica:**
- `backend/ServicioEstadisticas/main.py`: nuevo endpoint `GET /api/v1/estadisticas/exportar`
  que retorna `StreamingResponse` con `media_type="text/csv"`
- `app/analizador.py`: función `exportar_csv(df)` que retorna el DataFrame serializado
- Angular `estadisticas.servicio.ts`: método `exportarCsv()` con `responseType: 'blob'`
- `tablero.componente.ts`: botón que llama al servicio y dispara la descarga con `URL.createObjectURL`

---

### 3. Historial de cambios de pedido (Audit Log)

**Descripción:** Cada vez que un pedido cambia de estado (Confirmado → Entregado,
Confirmado → Cancelado), se registra quién lo cambió, cuándo y desde qué estado.

**Justificación técnica:** Requerimiento habitual en sistemas de gestión para auditoría
y resolución de disputas. Se puede implementar sin cambiar el dominio existente.

**Qué se modifica:**
- SQL Server: tabla `PedidoHistorial (Id, PedidoId, EstadoAnterior, EstadoNuevo, FechaCambio)`
- `sp_ActualizarPedido`: modificar para insertar en `PedidoHistorial` dentro de la misma transacción
- Angular: sección expandible en la fila del pedido que muestra el historial

---

### 4. Búsqueda de clientes en tiempo real

**Descripción:** El campo de búsqueda en el listado de clientes filtra resultados
mientras el usuario escribe, sin presionar Enter ni esperar paginación.

**Justificación técnica:** Mejora de UX con `debounceTime` de RxJS. Evita saturar
el backend con una petición por cada tecla pulsada.

**Qué se modifica:**
- `sp_ListarClientes`: agregar parámetro `@Busqueda NVARCHAR(100) = NULL` con
  `WHERE (@Busqueda IS NULL OR Nombres LIKE '%' + @Busqueda + '%' OR Apellidos LIKE '%' + @Busqueda + '%')`
- `ClienteRepository.php`: pasar el parámetro en `listar()`
- Angular `clientes.componente.ts`: `Subject<string>` con `debounceTime(300)` + `distinctUntilChanged()`
  conectado al input de búsqueda

---

### 5. Alertas de pedidos pendientes

**Descripción:** Un indicador en el sidebar muestra la cantidad de pedidos en estado
`CONFIRMADO` que llevan más de 24 horas sin cambiar de estado, como recordatorio
para el equipo de ventas.

**Justificación técnica:** Uso de polling reactivo con `RxJS interval()`, patrón
habitual en dashboards de operaciones en tiempo real sin WebSockets.

**Qué se modifica:**
- PHP: endpoint `GET /api/v1/pedidos/alertas` que retorna el conteo de pedidos
  `CONFIRMADO` con `FechaCreacion < DATEADD(HOUR, -24, GETUTCDATE())`
- Angular: `AlertasServicio` con `interval(60000)` que llama al endpoint cada minuto
- `panel.layout.ts`: badge numérico en el enlace "Pedidos" del sidebar

---

## Sección C — Instrucciones para implementar

La regla general es siempre partir desde la base de datos hacia arriba:
**BD → Dominio → Infraestructura → Aplicación → Presentación → Frontend**.

### Orden recomendado de trabajo

Para cualquier funcionalidad nueva, seguir siempre este orden:

```
1. Base de datos
   └── Modificar/crear tabla en esquema.sql
   └── Crear o modificar Stored Procedures
   └── Ejecutar en SQL Server (docker exec sqlcmd)

2. Dominio (PHP o .NET)
   └── Modificar entidad si hay nuevas reglas de negocio
   └── Actualizar interface del repositorio

3. Infraestructura
   └── Implementar nuevo método en el repositorio
   └── Llamar al nuevo SP

4. Aplicación
   └── Agregar método al App Service
   └── Manejar errores de dominio

5. Presentación (backend)
   └── Acción en el controller
   └── Registrar ruta nueva

6. Frontend (Angular)
   └── Actualizar modelo si la respuesta cambia
   └── Agregar método al servicio
   └── Implementar en el componente

7. Reconstruir y probar
   └── docker compose build [servicio]
   └── docker compose up -d [servicio]
   └── Probar manualmente desde el frontend
```

### Cómo probar cada cambio

```bash
# Reconstruir solo el servicio afectado (no todos)
docker compose build servicio-clientes-pedidos
docker compose up -d servicio-clientes-pedidos

# Ver logs en tiempo real
docker logs pruebatt-clientes-pedidos -f

# Probar endpoint directamente
curl -X GET http://localhost:8080/api/v1/clientes?pagina=1&tamanio=5 \
  -H "Authorization: Bearer <token>"
```

### Qué tests agregar por cada funcionalidad

| Funcionalidad | Test a agregar |
|---|---|
| Rol de usuario | Test en `AutenticacionAppServiceTests.cs` — verificar que el claim `rol` está en el token |
| Exportar CSV | Test en `test_analizador.py` — `exportar_csv()` retorna string con cabeceras correctas |
| Audit log | Test en `PedidoNuevosTest.php` — verificar que el SP se llama (con mock del repo) |
| Búsqueda | Test en `ClienteAppServiceTest.php` — `listarClientes()` pasa el parámetro de búsqueda |
| Alertas | Test en `pedido.servicio.spec.ts` — `obtenerAlertas()` llama al endpoint correcto |

### Convenciones de nombres

| Elemento | Patrón |
|---|---|
| SPs | `sp_VerboCamelCase` ej. `sp_ListarPedidosConAlertas` |
| Clases PHP de dominio | PascalCase en español: `HistorialPedido` |
| Servicios Angular | PascalCase + sufijo `Servicio`: `AlertasServicio` |
| Endpoints | Sustantivos en kebab-case: `/api/v1/pedidos/alertas` |
| Variables de entorno | MAYUSCULAS_SEPARADAS: `JWT_CLAVE`, `DB_SERVIDOR` |

### Convenciones a respetar en el código

| Aspecto | Convención |
|---|---|
| Nombres de entidades y casos de uso | Español (ej. `Cliente`, `PedidoAppService`) |
| Nombres de infraestructura y config | Inglés o mixto (ej. `ConexionSqlServer`, `docker-compose.yml`) |
| Métodos de dominio | Verbos en español: `crear()`, `confirmar()`, `cancelar()` |
| Respuesta HTTP | Siempre `{ exito, datos, errores }` |
| Stored Procedures | Prefijo `sp_` + acción + entidad: `sp_AgregarCliente` |
| Componentes Angular | Sufijo `Componente` en PascalCase, selector `app-` en kebab |
| Servicios Angular | Sufijo `Servicio`, `providedIn: 'root'` |
