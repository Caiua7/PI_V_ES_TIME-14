from fastapi import APIRouter
from app.api.v1.endpoints import ai as ai_endpoints

# Importando endpoints
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.import_excel import router as import_excel_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.import_jobs import router as import_jobs_router
from app.api.v1.endpoints.pricing import router as pricing_router
from app.api.v1.endpoints.depara import router as depara_router

api_router = APIRouter()

# 🔐 Auth
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"]
)

# 📊 Excel
api_router.include_router(
    import_excel_router,
    prefix="/excel",
    tags=["Importação"]
)

# 📈 Analytics
api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

# 📦 Jobs (status + erros)
api_router.include_router(
    import_jobs_router,
    prefix="/jobs",
    tags=["Import Jobs"]
)

# 💰 Pricing
api_router.include_router(
    pricing_router,
    prefix="/pricing",
    tags=["Pricing"]
)

api_router.include_router(
    depara_router,
    prefix="/depara",
    tags=["Depara"]
)
api_router.include_router(
    ai_endpoints.router,
    prefix="/ai",
    tags=["Inteligência Artificial"]
)
