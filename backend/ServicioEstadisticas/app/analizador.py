"""
Análisis estadístico de pedidos con pandas y numpy.
Demuestra: groupby, reindex con date_range, rolling mean y agregaciones.
"""

import math
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


def _f(v: float) -> float:
    """Sanitiza NaN/Inf antes de serializar a JSON."""
    return 0.0 if (math.isnan(v) or math.isinf(v)) else v


# ──────────────────────────────────────────────────────────────────────────────
# Función principal
# ──────────────────────────────────────────────────────────────────────────────

def analizar(df: pd.DataFrame, total_clientes: int) -> dict:
    if df.empty:
        return _respuesta_vacia(total_clientes)

    df = _preparar(df)

    return {
        "resumen":          _resumen(df, total_clientes),
        "actividadDiaria":  _actividad_diaria(df),
        "actividadMensual": _actividad_mensual(df),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Preparación
# ──────────────────────────────────────────────────────────────────────────────

def _preparar(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["fechaCreacion"] = pd.to_datetime(df["fechaCreacion"], utc=True)
    df["fecha"]  = df["fechaCreacion"].dt.date
    df["total"]  = df["total"].astype(float)
    df["estado"] = df["estado"].str.upper()
    return df


# ──────────────────────────────────────────────────────────────────────────────
# Resumen — tarjetas del dashboard
# ──────────────────────────────────────────────────────────────────────────────

def _resumen(df: pd.DataFrame, total_clientes: int) -> dict:
    conteo = df["estado"].value_counts()

    completados          = int(conteo.get("ENTREGADO", 0))
    pendientesConfirmados = int(conteo.get("PENDIENTE", 0) + conteo.get("CONFIRMADO", 0))
    cancelados           = int(conteo.get("CANCELADO", 0))

    return {
        "totalPedidos":           len(df),
        "completados":            completados,
        "pendientesYConfirmados": pendientesConfirmados,
        "cancelados":             cancelados,
        "totalClientes":          total_clientes,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Actividad diaria — últimos 30 días con media móvil 7 días
#
# La media móvil suaviza picos puntuales y permite ver la tendencia real.
# Se rellena con 0 los días sin pedidos para mantener continuidad en la gráfica.
# ──────────────────────────────────────────────────────────────────────────────

def _actividad_diaria(df: pd.DataFrame) -> list[dict]:
    hoy    = datetime.utcnow().date()
    inicio = hoy - timedelta(days=29)

    reciente = df[df["fecha"] >= inicio]

    diario = (
        reciente
        .groupby("fecha")
        .size()
        .rename("pedidos")
        .reset_index()
        .set_index("fecha")
        .reindex(pd.date_range(inicio, hoy, freq="D").date, fill_value=0)
        .reset_index()
        .rename(columns={"index": "fecha"})
    )

    # Media móvil de 7 días — numpy subyacente vía pandas rolling
    diario["mediaMovil7d"] = (
        diario["pedidos"]
        .rolling(window=7, min_periods=1)
        .mean()
        .round(1)
    )

    return [
        {
            "fecha":        str(r["fecha"]),
            "pedidos":      int(r["pedidos"]),
            "mediaMovil7d": _f(float(r["mediaMovil7d"])),
        }
        for _, r in diario.iterrows()
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Actividad mensual — últimos 6 meses
#
# Usa dt.to_period para agrupar por mes de forma limpia con pandas.
# ──────────────────────────────────────────────────────────────────────────────

def _actividad_mensual(df: pd.DataFrame) -> list[dict]:
    hace6 = datetime.utcnow().date().replace(day=1) - timedelta(days=1)
    hace6 = (hace6.replace(day=1) - timedelta(days=150)).replace(day=1)

    reciente = df[df["fecha"] >= hace6].copy()
    if reciente.empty:
        return []

    reciente["mes"] = pd.to_datetime(reciente["fecha"]).dt.to_period("M")

    mensual = (
        reciente
        .groupby("mes")
        .size()
        .rename("pedidos")
        .reset_index()
        .tail(6)
    )

    return [
        {
            "mes":     str(r["mes"]),
            "pedidos": int(r["pedidos"]),
        }
        for _, r in mensual.iterrows()
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Respuesta vacía
# ──────────────────────────────────────────────────────────────────────────────

def _respuesta_vacia(total_clientes: int) -> dict:
    return {
        "resumen": {
            "totalPedidos": 0, "completados": 0,
            "pendientesYConfirmados": 0, "cancelados": 0,
            "totalClientes": total_clientes,
        },
        "actividadDiaria":  [],
        "actividadMensual": [],
    }
