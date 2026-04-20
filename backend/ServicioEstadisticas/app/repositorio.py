import pandas as pd
from .conexion import obtener_conexion


def obtener_pedidos() -> pd.DataFrame:
    """Retorna todos los pedidos con sus campos relevantes."""
    query = """
        SELECT
            Id            AS id,
            ClienteId     AS clienteId,
            FechaCreacion AS fechaCreacion,
            Estado        AS estado,
            Total         AS total
        FROM Pedidos
        ORDER BY FechaCreacion ASC
    """
    with obtener_conexion() as conn:
        return pd.read_sql(query, conn)


def obtener_total_clientes() -> int:
    """Retorna el total de clientes activos."""
    query = "SELECT COUNT(*) FROM Clientes WHERE Activo = 1"
    with obtener_conexion() as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        return cursor.fetchone()[0]
