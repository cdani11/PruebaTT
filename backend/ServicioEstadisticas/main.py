from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.analizador import analizar
from app.repositorio import obtener_pedidos, obtener_total_clientes

load_dotenv()

app = FastAPI(title="Servicio de Estadísticas", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/v1/estadisticas")
def estadisticas():
    try:
        df              = obtener_pedidos()
        total_clientes  = obtener_total_clientes()
        return {"exito": True, "datos": analizar(df, total_clientes), "errores": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
