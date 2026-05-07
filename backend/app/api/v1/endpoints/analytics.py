from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

# 1. Importação CORRETA do banco de dados:
from app.infrastructure.database import get_db
# 2. Importação CORRETA da autenticação:
from app.api.dependencies import get_current_user

from app.application.analytics_engine import AnalyticsEngine
from app.domain.models.schemas.analytics import (
    AnalyticsCardsResponse,
    AnalyticsEvolutionResponse,
    AnalyticsFilters
)
from app.core.limiter import limiter

router = APIRouter()

@router.get("/cards", response_model=AnalyticsCardsResponse)
@limiter.limit("10/minute")
def get_analytics_cards(
    request: Request,
    sku: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    # 3. Dependência corrigida aqui:
    current_user = Depends(get_current_user)
):
    filters = AnalyticsFilters(
        sku=sku,
        category=category,
        date_from=date_from,
        date_to=date_to
    )
    engine = AnalyticsEngine(db)
    return engine.get_cards(filters)

@router.get("/evolution", response_model=AnalyticsEvolutionResponse)
@limiter.limit("10/minute")
def get_analytics_evolution(
    request: Request,
    sku: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    # 4. Dependência corrigida aqui:
    current_user = Depends(get_current_user)
):
    filters = AnalyticsFilters(
        sku=sku,
        category=category,
        date_from=date_from,
        date_to=date_to
    )
    engine = AnalyticsEngine(db)
    return engine.get_evolution(filters)