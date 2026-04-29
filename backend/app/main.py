# Ponto de entrada que inicia o FastAPI

from fastapi import FastAPI

from app.infrastructure.database import Base, engine
from app.domain.models.import_job import ImportJob

# 👇 IMPORTANTE
from app.api.v1.api import api_router

app = FastAPI()


@app.on_event("startup")
def on_startup():
    print("Criando banco...")
    Base.metadata.create_all(bind=engine)


# 👇 REGISTRA AS ROTAS
app.include_router(api_router)