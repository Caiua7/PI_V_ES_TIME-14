# Ficheiro que junta todas as rotas

from fastapi import APIRouter

# Importando os endpoints existentes
from app.api.v1.endpoints.import_excel import router as import_excel_router
from app.api.v1.endpoints.analytics import router as analytics_router

# 🔥 IMPORT CORRIGIDO (direto do arquivo)
from app.api.v1.endpoints.import_jobs import router as import_jobs_router

api_router = APIRouter()

# Rota de upload de Excel
api_router.include_router(
    import_excel_router,
    prefix="/excel",
    tags=["Importação"]
)

# Rota de Analytics
api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

# ✅ NOVA ROTA DE STATUS
api_router.include_router(
    import_jobs_router,
    prefix="/jobs",
    tags=["Import Jobs"]
)

# Rotas futuras
# from app.api.v1.endpoints.auth import router as auth_router
# api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])