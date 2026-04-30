# Pessoa 2: CRUD e Histórico

from __future__ import annotations
 
from fastapi import APIRouter, Depends, Query
from typing import Optional
 
from app.application.pricing_service import PricingService
from app.models.schemas.pricing import (
    PricingHistoryFilters,
    PricingHistoryRecord,
    PricingHistoryResponse,
    PricingHistoryMeta,
    FiltersApplied,
)
 
router = APIRouter()
 
 
@router.get(
    "/history",
    response_model=PricingHistoryResponse,
    summary="Listar histórico de pricing",
    description=(
        "Retorna registros de pricing_history com filtros combinados, "
        "ordenação e exclusão automática de registros deletados (soft delete)."
    ),
)
def list_pricing_history(
    client:       Optional[str] = Query(None, description="Filtrar por cliente"),
    sku:          Optional[str] = Query(None, description="Filtrar por SKU"),
    category:     Optional[str] = Query(None, description="Filtrar por categoria"),
    subcategory:  Optional[str] = Query(None, description="Filtrar por subcategoria"),
    manager:      Optional[str] = Query(None, description="Filtrar por gestora"),
    status:       Optional[str] = Query(None, description="Filtrar por status"),
    datasul_code: Optional[str] = Query(None, description="Filtrar por código Datasul"),
    date_from:    Optional[str] = Query(None, description="Mês inicial YYYY-MM"),
    date_to:      Optional[str] = Query(None, description="Mês final YYYY-MM"),
    sort_by:      Optional[str] = Query("created_at", description="Campo para ordenação"),
    sort_order:   Optional[str] = Query("desc", description="asc ou desc"),
):
    # Valida e agrupa os filtros via Pydantic
    filters = PricingHistoryFilters(
        client=client,
        sku=sku,
        category=category,
        subcategory=subcategory,
        manager=manager,
        status=status,
        datasul_code=datasul_code,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )
 
    records = PricingService.list_history(filters)
 
    return PricingHistoryResponse(
        data=[PricingHistoryRecord(**r) for r in records],
        meta=PricingHistoryMeta(
            total=len(records),
            filters_applied=FiltersApplied(
                client=client,
                sku=sku,
                category=category,
                subcategory=subcategory,
                manager=manager,
                status=status,
                datasul_code=datasul_code,
                date_from=date_from,
                date_to=date_to,
                sort_by=sort_by,
                sort_order=sort_order,
            ),
        ),
    )
