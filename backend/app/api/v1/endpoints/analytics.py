from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.dependencies import get_db
from app.application.analytics_engine import AnalyticsEngine
from app.domain.models.schemas.analytics import (
    AnalyticsEvolutionResponse,
    AnalyticsCardsResponse
)

router = APIRouter()

@router.get("/evolution", response_model=AnalyticsEvolutionResponse)
def get_pricing_evolution(
    sku: Optional[str] = Query(None, description="Filtrar por um SKU específico"),
    category: Optional[str] = Query(None, description="Filtrar por uma categoria"),
    db: Session = Depends(get_db)
):
    """
    Retorna a série histórica de preços e margens para os gráficos.
    """
    engine = AnalyticsEngine(db)
    return engine.get_evolution(sku=sku, category=category)

@router.get("/cards", response_model=AnalyticsCardsResponse)
def get_dashboard_cards(
    sku: Optional[str] = Query(None, description="Filtrar KPIs por SKU"),
    category: Optional[str] = Query(None, description="Filtrar KPIs por categoria"),
    db: Session = Depends(get_db)
):
    """
    Retorna os KPIs principais (Preço Médio, Margem, etc) para os cards do topo.
    """
    engine = AnalyticsEngine(db)
    return engine.get_cards(sku=sku, category=category)