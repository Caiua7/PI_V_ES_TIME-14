# Ponto de entrada que inicia o FastAPI

from fastapi import FastAPI

from app.infrastructure.database import Base, engine
from app.domain.models.import_job import ImportJob
from app.api.v1.api import api_router

app = FastAPI(title="NeoPrice API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API! Acesse /docs para ver as rotas disponíveis."}  #esta aqui para teste apenas

@app.on_event("startup")
def on_startup():
    print("Criando banco...")
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# registra rotas com prefixo (padrão do projeto)
app.include_router(api_router, prefix="/api/v1")
