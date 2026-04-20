# 🚀 Guía para ejecutar el Frontend Angular

## ✅ Estado actual del proyecto

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

## 🔧 Requisitos previos

- **Node.js** >= 18 (verificar con `node -v`)
- **npm** >= 9 (verificar con `npm -v`)
- **Angular CLI** (instalar con `npm install -g @angular/cli`)
- Servicios backend corriendo en Docker (ver `docker-compose ps`)

---

## 📋 Pasos para ejecutar

### 1️⃣ Verificar que el backend está levantado

```bash
# Debe mostrar 3 containers en "Up" (healthy)
docker compose ps

# Resultado esperado:
# pruebatt-sqlserver              Up 
# pruebatt-autenticacion          Up
# pruebatt-clientes-pedidos       Up
```

### 2️⃣ Instalar dependencias de Angular

```bash
cd frontend/frontend-angular
npm install
```

Esto descargará:
- Angular 17 + dependencias
- Tailwind CSS
- RxJS, TypeScript, etc.

⏱️ Tiempo: ~2-3 minutos (depende de tu internet)

### 3️⃣ Verificar las URLs del backend

Abre `frontend/frontend-angular/src/environments/environment.ts` y confirma:

```typescript
export const environment = {
  produccion: false,
  apiAutenticacion: 'http://localhost:5001/api/v1',      // ← .NET, puerto 5001
  apiClientesPedidos: 'http://localhost:8080/api/v1'     // ← PHP, puerto 8080
};
```

Si tus puertos son diferentes, actualiza aquí.

### 4️⃣ Levantar el servidor de desarrollo

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

### 5️⃣ Abrir en el navegador

Navega a: **http://localhost:4200**

Deberías ver la pantalla de **Iniciar sesión**.

---

## 🧪 Flujo de prueba completo

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

## 🐛 Troubleshooting

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

## 📱 URLs útiles

| Recurso | URL |
|---|---|
| **Frontend** | http://localhost:4200 |
| **Swagger .NET** | http://localhost:5001/swagger |
| **Swagger PHP** | http://localhost:8080/docs |
| **API Clientes** | http://localhost:8080/api/v1/clientes |
| **API Pedidos** | http://localhost:8080/api/v1/pedidos |
| **API Autenticación** | http://localhost:5001/api/v1/autenticacion |

---

## 🔄 Flujo de la aplicación

```
┌─────────────────┐
│  Login/Registro │ ← localhost:4200/autenticacion
└────────┬────────┘
         │ Obtiene JWT token
         ▼
┌─────────────────┐
│   Tablero       │ ← localhost:4200 (ruta protegida)
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐ ┌──────────┐
│Clientes│ │ Pedidos  │
└────────┘ └──────────┘
    │          │
    ▼          ▼
 GET/POST   GET/POST/PATCH
  :8080      :8080
```

---

## 📦 Dependencias principales

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

## ✨ Características implementadas

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

## 🎯 Próximos pasos opcionales

- [ ] Agregar validación en tiempo real con debounce
- [ ] Agregar toast notifications
- [ ] Exportar datos a CSV/PDF
- [ ] Gráficos de ventas (Chart.js ya instalado)
- [ ] Tests unitarios (Jasmine/Karma)
- [ ] Internacionalización (i18n)

---

## 💡 Tips

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
