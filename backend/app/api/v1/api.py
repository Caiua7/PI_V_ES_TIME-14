# Ficheiro que junta todas as rotas acima

from fastapi import APIRouter

from app.api.v1.endpoints import import_excel

api_router = APIRouter()

api_router.include_router(import_excel.router)