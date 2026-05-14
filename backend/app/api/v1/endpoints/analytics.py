from fastapi import APIRouter, Depends, Query, Request
from typing import Optional

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
    client: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    datasul_code: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    filters = AnalyticsFilters(
        client=client,
        sku=sku,
        datasul_code=datasul_code,
        category=category,
        subcategory=subcategory,
        size=size,
        date_from=date_from,
        date_to=date_to
    )
    engine = AnalyticsEngine()
    return engine.get_cards(filters)

@router.get("/evolution", response_model=AnalyticsEvolutionResponse)
@limiter.limit("10/minute")
def get_analytics_evolution(
    request: Request,
    client: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    datasul_code: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    filters = AnalyticsFilters(
        client=client,
        sku=sku,
        datasul_code=datasul_code,
        category=category,
        subcategory=subcategory,
        size=size,
        date_from=date_from,
        date_to=date_to
    )
    engine = AnalyticsEngine()
    return engine.get_evolution(filters)
