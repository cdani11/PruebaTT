# Frontend Angular 17

## Descripción general

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

## Estado actual del proyecto

El frontend Angular está **90% listo**. Incluye:

| Componente | Estado | Detalles |
|---|---|---|
| **Autenticación** | ✅ Completo | Login + Registro con JWT |
| **Modelos** | ✅ Completo | Cliente, Pedido, DetallePedido |
| **Servicios** | ✅ Completo | ClienteServicio, PedidoServicio, AutenticacionServicio |
| **Componentes** | ✅ Completo | Clientes (CRUD), Pedidos (CRUD + cancelar) |
| **Rutas** | ✅ Completo | Lazy loading + Route Guard |
| **Interceptores** | ✅ Completo | Token Bearer + Manejo de errores 401 |
| **Estilos** | ✅ Completo | Tailwind CSS configurado |
| **Paginación** | ✅ Completo | Tabla con pagination |

---

## Requisitos previos

- **Node.js** >= 18 (verificar con `node -v`)
- **npm** >= 9 (verificar con `npm -v`)
- **Angular CLI** (instalar con `npm install -g @angular/cli`)
- Servicios backend corriendo en Docker (ver `docker-compose ps`)

---

## Pasos para ejecutar

### 1. Verificar que el backend está levantado

```bash
# Debe mostrar 3 containers en "Up" (healthy)
docker compose ps

# Resultado esperado:
# pruebatt-sqlserver              Up
# pruebatt-autenticacion          Up
# pruebatt-clientes-pedidos       Up
```

### 2. Instalar dependencias de Angular

```bash
cd frontend/frontend-angular
npm install
```

Esto descargará:
- Angular 17 + dependencias
- Tailwind CSS
- RxJS, TypeScript, etc.

⏱️ Tiempo: ~2-3 minutos (depende de tu internet)

### 3. Verificar las URLs del backend

Abre `frontend/frontend-angular/src/environments/environment.ts` y confirma:

```typescript
export const environment = {
  produccion: false,
  apiAutenticacion: 'http://localhost:5001/api/v1',      // ← .NET, puerto 5001
  apiClientesPedidos: 'http://localhost:8080/api/v1'     // ← PHP, puerto 8080
};
```

Si tus puertos son diferentes, actualiza aquí.

### 4. Levantar el servidor de desarrollo

```bash
# Desde frontend/frontend-angular/
ng serve

# O equivalente:
npm start
```

**Output esperado:**
```
✔ Compiled successfully.
⠙ Building...

Application bundle generation complete.

Initial Chunk Files   | Names         |      Size
main.js              |               | 250.15 kB |
polyfills.js         |               | 128.50 kB |
```

### 5. Abrir en el navegador

Navega a: **http://localhost:4200**

Deberías ver la pantalla de **Iniciar sesión**.

---

## Flujo de prueba completo

### 1. Registro

1. Haz clic en **"Crear cuenta"**
2. Completa:
   - **Usuario**: `testuser`
   - **Correo**: `test@example.com`
   - **Clave**: `Test1234!`
3. Haz clic en **"Crear cuenta"**
4. Si todo va bien, te redirige al **Tablero**

✅ El JWT token se guardó en `localStorage` bajo la clave `pruebatt_token`

### 2. Sección Clientes

1. Haz clic en **"Clientes"** en el sidebar
2. Haz clic en **"+ Nuevo cliente"**
3. Completa:
   - **Nombres**: `Juan`
   - **Apellidos**: `Pérez`
   - **Correo**: `juan@test.com`
   - **Teléfono**: `9999-9999`
4. Haz clic en **"Guardar cliente"**
5. El cliente aparece en la tabla con paginación

✅ Endpoints de clientes funcionando: `GET /clientes`, `POST /clientes`, etc.

### 3. Sección Pedidos

1. Haz clic en **"Pedidos"** en el sidebar
2. Haz clic en **"+ Nuevo pedido"**
3. Completa:
   - **Cliente**: Selecciona el cliente creado arriba (dropdown)
   - **Línea 1**:
     - Producto: `Laptop`
     - Cantidad: `1`
     - Precio: `899.99`
   - Haz clic en **"+ Agregar línea"** si quieres más items
4. Haz clic en **"Crear pedido"**
5. El pedido aparece en la tabla con estado **Confirmado**

✅ Endpoints de pedidos funcionando: `POST /pedidos`, `GET /pedidos`, etc.

### 4. Cancelar un Pedido

1. En la tabla de pedidos, haz clic en el botón **"Cancelar"** de un pedido
2. Confirma en el diálogo que aparece
3. El estado cambia a **Cancelado** (badge rojo)

✅ Endpoint `PATCH /pedidos/{id}/cancelar` funcionando

### 5. Cerrar sesión

1. Haz clic en el botón **"Cerrar sesión"** (rojo, en el sidebar)
2. Vuelves a la pantalla de **Iniciar sesión**
3. El token fue limpiado de `localStorage`

---

## Troubleshooting

### ❌ "Cannot GET /clientes" o "404 Not Found"

**Causa**: Las URLs del backend no coinciden

**Solución**:
```bash
# Verifica que el backend esté corriendo
docker compose ps

# Verifica las URLs en environment.ts
cat frontend/frontend-angular/src/environments/environment.ts

# Prueba los endpoints directamente
curl http://localhost:8080/api/v1/clientes
curl http://localhost:5001/api/v1/autenticacion/inicio-sesion
```

### ❌ Error de CORS

**Causa**: El backend no tiene CORS habilitado

**Status**: ✅ Ya está configurado en ambos servicios (`AllowAnyOrigin()`)

Si persiste, verifica:
- Que los puertos sean correctos (5001 para .NET, 8080 para PHP)
- Que hayas esperado a que SQL Server levante (healthcheck)

### ❌ Tabla vacía o "No hay clientes"

**Causa**: Los datos no se están cargando del backend

**Debugging**:
1. Abre DevTools (F12)
2. Ve a **Network** tab
3. Haz clic en **"Nuevo cliente"** y observa la petición
4. Verifica que el status sea `201` (Created) o `200` (OK)

### ❌ "Error al crear el cliente" / advisory en Composer

**Causa**: El backend PHP tiene una dependencia con advisory de seguridad

**Status**: ✅ Ya está ignorada en `composer.json` (`audit.ignore`)

---

## URLs útiles

| Recurso | URL |
|---|---|
| **Frontend** | http://localhost:4200 |
| **Swagger .NET** | http://localhost:5001/swagger |
| **Swagger PHP** | http://localhost:8080/docs |
| **API Clientes** | http://localhost:8080/api/v1/clientes |
| **API Pedidos** | http://localhost:8080/api/v1/pedidos |
| **API Autenticación** | http://localhost:5001/api/v1/autenticacion |

---

## Dependencias principales

```json
{
  "@angular/core": "^17.0.0",
  "@angular/router": "^17.0.0",
  "@angular/forms": "^17.0.0",
  "rxjs": "~7.8.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Características implementadas

- ✅ Componentes standalone (no necesita NgModule)
- ✅ Control flow syntax moderno (`@if`, `@for`)
- ✅ Signals para state management
- ✅ Typed forms (ReactiveFormsModule en servicios)
- ✅ Interceptores de HTTP (token + error handling)
- ✅ Route guards (autenticación)
- ✅ Lazy loading de rutas
- ✅ Paginación cliente-servidor
- ✅ Modal inline con backdrop
- ✅ Tabla dinámica con detalles
- ✅ Validación de formularios
- ✅ Manejo de errores elegante
- ✅ Estilos Tailwind responsive

---

## Próximos pasos opcionales

- [ ] Agregar validación en tiempo real con debounce
- [ ] Agregar toast notifications
- [ ] Exportar datos a CSV/PDF
- [ ] Gráficos de ventas (Chart.js ya instalado)
- [ ] Tests unitarios (Jasmine/Karma)
- [ ] Internacionalización (i18n)

---

## Tips

- **Guardar token en localStorage**: Implementado ✅
- **Refrescar token automáticamente**: No implementado (considerar agregar si los tokens expiran < 1 hora)
- **Logout en error 401**: Implementado ✅
- **CORS habilitado en backend**: ✅

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) y los logs del backend:
```bash
docker compose logs -f servicio-autenticacion
docker compose logs -f servicio-clientes-pedidos
```

---

## Extender el frontend

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

## Pruebas unitarias

### Prerrequisitos

```bash
cd frontend/frontend-angular
npm install
```

Requiere Node.js 18+ y un navegador (Chrome o Edge) instalado.

### Ejecutar los tests

```bash
npm test
```

Esto abre Karma en el navegador y ejecuta los tests en modo watch (re-ejecuta al guardar).

Para una sola ejecución sin modo watch, cierra la ventana del navegador o presiona `Ctrl+C`.

### Specs disponibles

#### `autenticacion.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `iniciarSesion() llama POST /login` | Método HTTP correcto y URL |
| `registrar() llama POST /registro` | Método HTTP correcto y URL |
| `cerrarSesion() limpia el token del localStorage` | El token se elimina correctamente |

#### `cliente.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `listar() incluye parámetros de paginación` | Query params `pagina` y `tamanio` presentes |
| `crear() llama POST y retorna el cliente` | Método POST + mapeo de respuesta |
| `actualizar() llama PUT /{id}` | URL con ID correcto |
| `eliminar() llama DELETE /{id}` | Método DELETE correcto |

#### `pedido.servicio.spec.ts`
| Test | Qué verifica |
|---|---|
| `listar() incluye parámetros de paginación` | Query params presentes |
| `listar() incluye filtros opcionales` | Filtros `estado` y `clienteId` en params |
| `crear() llama POST y retorna el pedido` | Método POST + mapeo |
| `cancelar() llama PATCH /cancelar` | URL y método correctos |
| `completar() llama PATCH /completar` | URL y método correctos |
| `editarDetalles() llama PUT /detalles con el cuerpo correcto` | Body `{ detalles }` y método PUT |
| `eliminar() llama DELETE` | Método DELETE correcto |

### Interpretar el output

```
Chrome Headless: Executed 15 of 15 SUCCESS (0.234 secs / 0.198 secs)
TOTAL: 15 SUCCESS
```

---

## Preguntas frecuentes de reclutadores

### ¿Cómo funciona el interceptor HTTP de Angular?

**Respuesta orientativa:**

Angular proporciona `HttpInterceptorFn` (API funcional de Angular 17) que intercepta
todas las peticiones salientes. En `token.interceptor.ts`:

```typescript
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (!token) return next(req);

  const reqConToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(reqConToken);
};
```

El interceptor `errores.interceptor.ts` observa las respuestas con `catchError`:
si recibe un 401, limpia el token y redirige al login. Ambos están registrados
en `app.config.ts` con `provideHttpClient(withInterceptors([...]))`.

---

### ¿Por qué Angular Signals en lugar de NgRx?

**Respuesta orientativa:**

Para el tamaño y complejidad de esta aplicación, NgRx habría sido sobreingeniería.
Signals (introducidos en Angular 16 y estabilizados en 17) ofrecen reactividad
sin el boilerplate de actions/reducers/selectors.

Cada componente usa `signal<T>()` para estado local (`cargando`, `error`, `pedidos`)
y actualiza la UI con `signal.set()` o `signal.update()`. La detección de cambios
solo se ejecuta cuando el signal cambia, lo que es más eficiente que el CD por zona.

Si el proyecto creciera con estado compartido entre muchos componentes
(carrito de compras, notificaciones globales), migraría a un servicio de estado
basado en Signals o usaría NgRx Signal Store.
