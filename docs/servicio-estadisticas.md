# Servicio de Estadísticas — Guía Técnica y de Entrevista

## 1. Qué hicimos

### Resumen ejecutivo
`ServicioEstadisticas` es un microservicio Python/FastAPI de **solo lectura** que consume la
base de datos `ClientesPedidosDb` y expone un endpoint REST con KPIs agregados para el
dashboard del frontend Angular.

**Puerto:** `8001`  
**Ruta principal:** `GET /api/v1/estadisticas`  
**Health check:** `GET /health`

---

### Decisiones técnicas clave

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Python + FastAPI | Endpoint PHP adicional | Lenguaje idóneo para análisis de datos; aislamiento de responsabilidades |
| pandas para cómputos | SQL puro (CTEs, Window Functions) | Media móvil, reindex de días vacíos y futuras regresiones son más expresivas en pandas |
| Microservicio independiente | Agregar endpoint en ServicioClientesPedidos | Escalabilidad independiente; lectura no interfiere con escritura |
| Solo GET, CORS libre | Token JWT en estadísticas | Datos son públicos dentro del sistema; simplifica el dashboard |

---

### Archivos del servicio

```
backend/ServicioEstadisticas/
├── main.py                  ← Arranque FastAPI, CORS, rutas
└── app/
    ├── conexion.py          ← Pool de conexiones pyodbc a SQL Server
    ├── repositorio.py       ← Queries SQL → DataFrames
    └── analizador.py        ← Toda la lógica de cómputo con pandas
```

---

### Flujo de datos

```
Frontend Angular
  └── EstadisticasServicio.obtener()
        └── GET http://localhost:8001/api/v1/estadisticas
              └── main.py → repositorio.obtener_pedidos() → DataFrame
                         → repositorio.obtener_total_clientes() → int
                         → analizador.calcular(df, total_clientes)
                               ├── _resumen()         → 5 tarjetas de KPI
                               ├── _actividad_diaria()  → últimos 30 días + media móvil 7d
                               └── _actividad_mensual() → últimos 6 meses
```

---

### KPIs actuales

#### Resumen (`/estadisticas.datos.resumen`)

| Campo | Descripción | Cómo se calcula |
|---|---|---|
| `totalPedidos` | Total histórico de pedidos | `len(df)` |
| `completados` | Pedidos entregados | `df[df.estado == 'ENTREGADO']` |
| `pendientesYConfirmados` | Pedidos activos | `PENDIENTE` + `CONFIRMADO` |
| `cancelados` | Pedidos cancelados | `df[df.estado == 'CANCELADO']` |
| `totalClientes` | Clientes activos | `SELECT COUNT(*) WHERE Activo = 1` |

#### Actividad diaria (`/estadisticas.datos.actividadDiaria`)

Rango: **últimos 30 días**. Un punto por día con:
- `fecha`: `YYYY-MM-DD`
- `pedidos`: cantidad del día
- `mediaMovil7d`: promedio móvil de 7 días (`rolling(window=7, min_periods=1).mean()`)

Los días sin pedidos se rellenan con `0` para mantener continuidad en el gráfico.

#### Actividad mensual (`/estadisticas.datos.actividadMensual`)

Rango: **últimos 6 meses**. Un punto por mes con:
- `mes`: `YYYY-MM`
- `pedidos`: total del mes (`dt.to_period("M")` + `groupby`)

---

### Queries SQL ejecutadas

```sql
-- Todos los pedidos (base de los cómputos)
SELECT Id, ClienteId, FechaCreacion, Estado, Total
FROM Pedidos
ORDER BY FechaCreacion ASC

-- Conteo de clientes activos
SELECT COUNT(*) FROM Clientes WHERE Activo = 1
```

---

## 2. Cómo presentarlo ante un reclutador

### Narrativa sugerida (30 segundos)

> "El sistema tiene tres microservicios de backend. Uno en .NET para autenticación,
> uno en PHP para clientes y pedidos, y uno en Python que hice específicamente para
> el análisis de datos. Ese servicio de estadísticas consume la base de datos de pedidos
> en modo solo lectura y usa pandas para calcular KPIs: totales por estado, actividad
> diaria con media móvil y tendencia mensual. El frontend Angular lo consume y renderiza
> las gráficas en un dashboard en tiempo real."

### Puntos a destacar activamente

1. **Separación de responsabilidades**: el servicio de estadísticas escala y despliega
   independientemente del servicio transaccional.
2. **Solo lectura**: el CORS está configurado para aceptar solo GET — imposible mutar datos desde él.
3. **pandas sobre SQL**: la media móvil de 7 días y el reindex de días vacíos son mucho más
   expresivos en Python que en T-SQL.
4. **Sanitización de NaN/Inf**: la función `_f()` convierte resultados de pandas que no son
   serializables a JSON (NaN, infinito) antes de devolver la respuesta.
5. **FastAPI**: tipado automático, documentación Swagger en `/docs`, validación por schema.

### Demo sugerida en entrevista

```bash
# 1. Levantar el stack
docker compose up -d

# 2. Mostrar la documentación generada automáticamente
# Abrir http://localhost:8001/docs

# 3. Ejecutar el endpoint en vivo
curl http://localhost:8001/api/v1/estadisticas | python -m json.tool

# 4. Mostrar el dashboard en Angular (http://localhost:4200)
#    Navegar a la sección de estadísticas
```

---

## 3. Preguntas frecuentes de reclutadores

### P1: ¿Por qué Python para estadísticas si el resto del backend es PHP y .NET?

**Respuesta:**
Python tiene el ecosistema más maduro para análisis de datos — pandas, numpy, scikit-learn.
Para cómputos como la media móvil o el relleno de fechas faltantes, el código en pandas
es 3 líneas; en T-SQL sería una CTE con `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` y
subconsultas de fechas. Además, FastAPI es extremadamente rápido de arrancar y genera
documentación Swagger automáticamente. La arquitectura de microservicios permite que cada
servicio use el lenguaje más apropiado para su responsabilidad.

---

### P2: ¿Por qué no hiciste el análisis directamente en SQL Server con Window Functions?

**Respuesta:**
SQL es poderoso para agregaciones, pero tiene limitaciones para análisis exploratorio.
`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` calcula la media móvil, pero rellenar los días
sin pedidos requiere un calendario auxiliar y `LEFT JOIN`. En pandas, `reindex` + `fill_value=0`
hace exactamente eso en una línea. También, si en el futuro se quiere agregar una predicción
de demanda con regresión lineal (`numpy.polyfit`), ya estamos en el entorno correcto.
El costo fue añadir un contenedor Docker más, que es mínimo.

---

### P3: ¿Cómo aseguras que los datos son consistentes si hay dos servicios leyendo la misma BD?

**Respuesta:**
`ServicioEstadisticas` es estrictamente de solo lectura — no tiene ninguna operación de
escritura, y el CORS solo acepta `GET`. El único servicio que escribe en `ClientesPedidosDb`
es `ServicioClientesPedidos`. SQL Server maneja el aislamiento de lecturas concurrentes
de forma nativa con su nivel de aislamiento por defecto (`READ COMMITTED`). No hay riesgo
de inconsistencia estructural porque no compartimos transacciones entre servicios.

---

### P4: ¿Qué pasa si la base de datos tiene millones de pedidos?

**Respuesta:**
El query actual carga todos los pedidos en memoria. Para un volumen real, lo optimizaría de
dos formas: primero, filtrar en SQL solo los pedidos de los últimos 30 días para la actividad
diaria (`WHERE FechaCreacion >= DATEADD(DAY, -30, GETUTCDATE())`). Segundo, para el resumen
de estados, usar un `SELECT Estado, COUNT(*) GROUP BY Estado` en lugar de traer todas las filas.
La tabla ya tiene índice en `FechaCreacion DESC` (`IX_Pedidos_FechaCreacion`), así que ese filtro
sería eficiente. También podría agregar caché con `functools.lru_cache` o Redis para evitar
recalcular en cada request.

---

### P5: ¿Los datos son en tiempo real?

**Respuesta:**
Casi en tiempo real. Cada request al frontend dispara una consulta fresca a la base de datos —
no hay cache intermedio actualmente. El delay es solo el tiempo de la query SQL más el cómputo
pandas, que en un dataset razonable es menor a 200ms. Si la latencia fuera un problema,
podría implementar caché con TTL de 30 segundos en el servidor sin que el usuario note diferencia.

---

### P6: ¿Por qué FastAPI y no Flask o Django?

**Respuesta:**
FastAPI tiene tres ventajas sobre Flask para este caso: (1) soporte nativo para async/await,
que permite queries no bloqueantes si migrara a `aioodbc`; (2) generación automática de
documentación Swagger en `/docs` sin configuración adicional; (3) validación de respuestas con
Pydantic, que asegura que la estructura JSON devuelta siempre coincide con el modelo TypeScript
del frontend. Django sería sobreingeniería para un servicio de un solo endpoint.

---

### P7: ¿Cómo manejas errores de conexión a la base de datos?

**Respuesta:**
`conexion.py` usa un pool de conexiones pyodbc. Si la conexión falla, FastAPI captura la
excepción y devuelve el formato estándar `{"exito": false, "errores": ["..."]}` con HTTP 500.
El endpoint `/health` está separado exactamente para que el orquestador (Docker Compose o
Kubernetes) detecte cuando el servicio está caído y no enrute tráfico hacia él. En producción
agregaría un retry con backoff exponencial en la capa de conexión.

---

## 4. Cómo agregar un nuevo KPI

Esta sección explica paso a paso cómo extender el servicio cuando el reclutador
pide agregar una nueva métrica. Sigue **exactamente** este orden.

---

### Ejemplo: agregar `ticketPromedio` (valor medio por pedido)

#### Paso 1 — Verificar que el dato existe en el DataFrame

La columna `Total` ya viene del query en `repositorio.py`:
```sql
SELECT Id, ClienteId, FechaCreacion, Estado, Total FROM Pedidos
```
No hace falta cambiar ningún query.

#### Paso 2 — Agregar el cómputo en `analizador.py`

Localizar el método `_resumen` (línea ~52) y agregar el nuevo campo:

```python
def _resumen(self, df: pd.DataFrame, total_clientes: int) -> dict:
    return {
        "totalPedidos": len(df),
        "completados": int((df["estado"] == "ENTREGADO").sum()),
        "pendientesYConfirmados": int(
            ((df["estado"] == "PENDIENTE") | (df["estado"] == "CONFIRMADO")).sum()
        ),
        "cancelados": int((df["estado"] == "CANCELADO").sum()),
        "totalClientes": total_clientes,
        # NUEVO KPI
        "ticketPromedio": self._f(df["total"].mean() if len(df) > 0 else 0.0),
    }
```

> `self._f()` sanitiza NaN/Inf → 0.0 para que JSON no falle.

#### Paso 3 — Actualizar el modelo TypeScript del frontend

Archivo: `frontend/frontend-angular/src/app/core/modelos/estadisticas.modelo.ts`

```typescript
export interface ResumenEstadisticas {
  totalPedidos: number;
  completados: number;
  pendientesYConfirmados: number;
  cancelados: number;
  totalClientes: number;
  ticketPromedio: number;  // NUEVO
}
```

#### Paso 4 — Mostrar en el componente

Archivo: `frontend/frontend-angular/src/app/features/estadisticas/tablero.componente.html`

Agregar una tarjeta junto a las existentes:
```html
<app-tarjeta-kpi
  titulo="Ticket Promedio"
  [valor]="estadisticas()?.resumen?.ticketPromedio | currency:'USD'"
  icono="receipt">
</app-tarjeta-kpi>
```

#### Paso 5 — Reconstruir y probar

```bash
docker compose build servicio-estadisticas
docker compose up -d servicio-estadisticas
curl http://localhost:8001/api/v1/estadisticas | python -m json.tool
# Verificar que "ticketPromedio" aparece en "resumen"
```

---

### Ejemplo: agregar `tasaCancelacion` (% de pedidos cancelados)

Solo requiere cambios en `analizador.py` — no hay nuevo dato del query:

```python
total = len(df)
cancelados = int((df["estado"] == "CANCELADO").sum())
tasa_cancelacion = self._f((cancelados / total * 100) if total > 0 else 0.0)
```

Y agregar `"tasaCancelacion": tasa_cancelacion` al dict de `_resumen`.

---

### Ejemplo: agregar `actividadPorEstado` (conteo diario separado por estado)

Este KPI requiere una nueva sección en la respuesta, no solo en el resumen.

#### En `analizador.py`, agregar un nuevo método:

```python
def _actividad_por_estado(self, df: pd.DataFrame) -> list[dict]:
    hoy = pd.Timestamp.utcnow().normalize()
    inicio = hoy - pd.Timedelta(days=29)
    df_rango = df[df["fechaCreacion"] >= inicio].copy()

    grupos = (
        df_rango.groupby([df_rango["fechaCreacion"].dt.date, "estado"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    grupos.rename(columns={"fechaCreacion": "fecha"}, inplace=True)
    grupos["fecha"] = grupos["fecha"].astype(str)
    return grupos.to_dict(orient="records")
```

#### En el método `calcular`, agregarlo a la respuesta:

```python
return {
    "resumen": self._resumen(df, total_clientes),
    "actividadDiaria": self._actividad_diaria(df),
    "actividadMensual": self._actividad_mensual(df),
    "actividadPorEstado": self._actividad_por_estado(df),  # NUEVO
}
```

---

### Catálogo de KPIs fáciles de agregar

| KPI | Campo | Cálculo pandas | Dificultad |
|---|---|---|---|
| Ticket promedio | `ticketPromedio` | `df["total"].mean()` | Baja |
| Tasa de cancelación | `tasaCancelacion` | `cancelados / total * 100` | Baja |
| Tasa de conversión | `tasaConversion` | `entregados / total * 100` | Baja |
| Pedidos este mes | `pedidosMesActual` | filtrar por mes + `len()` | Baja |
| Tiempo medio a entrega | `diasMedioEntrega` | requiere columna `FechaEntrega` | Media |
| Clientes sin pedidos | `clientesSinPedidos` | LEFT JOIN lógico con `merge` | Media |
| Top 5 productos | `topProductos` | query adicional en `PedidoDetalles` | Media |
| Predicción próximo mes | `prediccionMes` | `numpy.polyfit` sobre serie mensual | Alta |

---

## 5. Ejemplo avanzado: ticket promedio por mes

### Nueva función en `app/analizador.py`

```python
def _ticket_promedio_mensual(df: pd.DataFrame) -> list[dict]:
    """Ticket promedio (total/pedido) agrupado por mes."""
    activos = df[df["estado"] != "CANCELADO"].copy()
    if activos.empty:
        return []

    activos["mes"] = pd.to_datetime(activos["fecha"]).dt.to_period("M")

    resultado = (
        activos
        .groupby("mes")["total"]
        .mean()
        .round(2)
        .reset_index()
        .tail(6)
    )

    return [
        {"mes": str(r["mes"]), "ticketPromedio": _f(float(r["total"]))}
        for _, r in resultado.iterrows()
    ]
```

### Incluir en `analizar()`

```python
def analizar(df: pd.DataFrame, total_clientes: int) -> dict:
    # ...código existente...
    return {
        "resumen":               _resumen(df, total_clientes),
        "actividadDiaria":       _actividad_diaria(df),
        "actividadMensual":      _actividad_mensual(df),
        "ticketPromedioMensual": _ticket_promedio_mensual(df),  # ← nuevo
    }
```

### Actualizar el modelo en Angular

En `src/app/core/modelos/estadisticas.modelo.ts`:

```typescript
export interface TicketMensual {
  mes: string;
  ticketPromedio: number;
}

export interface Estadisticas {
  resumen: ResumenEstadisticas;
  actividadDiaria: PuntoDiario[];
  actividadMensual: PuntoMensual[];
  ticketPromedioMensual: TicketMensual[];  // ← nuevo
}
```

### Reconstruir

```bash
docker compose build servicio-estadisticas
docker compose up -d servicio-estadisticas
```

---

## 6. Pruebas unitarias

El servicio de estadísticas no cuenta actualmente con tests unitarios automatizados.
El módulo `app/analizador.py` contiene toda la lógica de análisis de datos.

### Recomendación para tests futuros

Usar **pytest** con **pandas** directamente:

```bash
pip install pytest
```

Ejemplo de test a implementar:

```python
# tests/test_analizador.py
import pandas as pd
from app.analizador import analizar

def test_resumen_con_dataframe_vacio():
    df = pd.DataFrame(columns=['id', 'fechaCreacion', 'estado', 'total'])
    resultado = analizar(df, total_clientes=5)
    assert resultado['resumen']['totalPedidos'] == 0
    assert resultado['resumen']['totalClientes'] == 5

def test_resumen_cuenta_estados_correctamente():
    df = pd.DataFrame([
        {'id': '1', 'fechaCreacion': '2026-01-01', 'estado': 'ENTREGADO', 'total': 100},
        {'id': '2', 'fechaCreacion': '2026-01-02', 'estado': 'CANCELADO', 'total': 50},
        {'id': '3', 'fechaCreacion': '2026-01-03', 'estado': 'CONFIRMADO', 'total': 75},
    ])
    resultado = analizar(df, total_clientes=3)
    assert resultado['resumen']['completados'] == 1
    assert resultado['resumen']['cancelados'] == 1
    assert resultado['resumen']['pendientesYConfirmados'] == 1
```

Ejecutar: `pytest tests/ -v` desde `backend/ServicioEstadisticas/`.

---

## 7. Dependencias y variables de entorno

```bash
# .env del servicio (o docker-compose.yml)
DB_SERVIDOR=sqlserver
DB_NOMBRE=ClientesPedidosDb
DB_USUARIO=sa
DB_CLAVE=TuClaveFuerte123!
```

```
# requirements.txt
fastapi==0.109.2
uvicorn[standard]==0.27.1
pyodbc==5.1.0
pandas==2.2.1
numpy==1.26.4
python-dotenv==1.0.1
```

```bash
# Arranque local (sin Docker)
cd backend/ServicioEstadisticas
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Swagger UI disponible en http://localhost:8001/docs
```
