# Ficheiro que junta todas as rotas acima

from app.api.v1.endpoints import pricing

api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing"])