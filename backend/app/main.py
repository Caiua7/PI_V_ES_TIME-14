# Ponto de entrada que inicia o FastAPI

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.infrastructure.database import Base, engine
from app.domain.models.import_job import ImportJob
from app.api.v1.api import api_router
from app.core.limiter import limiter

app = FastAPI(title="NeoPrice API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
