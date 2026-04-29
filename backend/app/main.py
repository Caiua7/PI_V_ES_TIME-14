# Ponto de entrada que inicia o FastAPI

from fastapi import FastAPI
from app.api.v1.api import api_router

# Esta linha é OBRIGATÓRIA. O Uvicorn procura por esse nome "app"
app = FastAPI(title="NeoPrice API", version="1.0.0")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# Isso conecta as rotas que você comentou anteriormente
app.include_router(api_router, prefix="/api/v1")