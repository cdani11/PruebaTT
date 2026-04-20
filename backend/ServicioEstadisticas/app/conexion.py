import os
import pyodbc


def obtener_conexion() -> pyodbc.Connection:
    servidor  = os.getenv("DB_SERVIDOR", "localhost")
    base      = os.getenv("DB_NOMBRE",   "ClientesPedidosDb")
    usuario   = os.getenv("DB_USUARIO",  "sa")
    clave     = os.getenv("DB_CLAVE",    "")

    cadena = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={servidor};"
        f"DATABASE={base};"
        f"UID={usuario};"
        f"PWD={clave};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(cadena)
