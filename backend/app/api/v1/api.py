# Ficheiro que junta todas as rotas acima
from fastapi import APIRouter
from app.api.v1.endpoints import analytics # Importe apenas o seu por enquanto

api_router = APIRouter()

# Deixe as outras comentadas com # até eles criarem os arquivos/routers
# api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])