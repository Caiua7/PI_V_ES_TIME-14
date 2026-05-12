"""
Endpoints — /api/v1/pricing
"""
 
from __future__ import annotations
 
from typing import Optional
 
from fastapi import APIRouter, Depends, Query, Request
from pydantic import ValidationError
from fastapi import HTTPException
 
from app.api.dependencies import get_current_user, require_role
from app.application.pricing_service import PricingService
from app.models.schemas.auth import UsuarioResponse
from app.models.schemas.pricing import (
    FiltersApplied,
    MessageResponse,
    PricingHistoryCreate,
    PricingHistoryFilters,
    PricingHistoryMeta,
    PricingHistoryRecord,
    PricingHistoryResponse,
    PricingHistoryUpdate,
)
 
router = APIRouter()
 
 
# ------------------------------------------------------------------ #
#  GET /pricing/history                                                #
#  Qualquer usuário autenticado pode listar                            #
# ------------------------------------------------------------------ #
 
@router.get(
    "/history",
    response_model=PricingHistoryResponse,
    summary="Listar histórico de pricing",
    description="Retorna registros ativos com filtros combinados e ordenação.",
)
def list_pricing_history(
    client:       Optional[str] = Query(None),
    sku:          Optional[str] = Query(None),
    category:     Optional[str] = Query(None),
    subcategory:  Optional[str] = Query(None),
    manager:      Optional[str] = Query(None),
    status:       Optional[str] = Query(None),
    datasul_code: Optional[str] = Query(None),
    date_from:    Optional[str] = Query(None, description="Mês inicial YYYY-MM"),
    date_to:      Optional[str] = Query(None, description="Mês final YYYY-MM"),
    sort_by:      Optional[str] = Query("created_at"),
    sort_order:   Optional[str] = Query("desc", description="asc ou desc"),
    current_user: UsuarioResponse = Depends(get_current_user),
):
    try:
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

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

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
 
 
# ------------------------------------------------------------------ #
#  POST /pricing/history                                               #
#  Apenas pricing e admin podem criar                                  #
# ------------------------------------------------------------------ #
 
@router.post(
    "/history",
    response_model=PricingHistoryRecord,
    status_code=201,
    summary="Criar registro de pricing",
)
def create_pricing(
    payload: PricingHistoryCreate,
    request: Request,
    current_user: UsuarioResponse = Depends(require_role("pricing", "admin")),
):
    record = PricingService.create(
        payload,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return PricingHistoryRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  PUT /pricing/history/{id}                                           #
#  Apenas pricing e admin podem editar                                 #
# ------------------------------------------------------------------ #
 
@router.put(
    "/history/{record_id}",
    response_model=PricingHistoryRecord,
    summary="Atualizar registro de pricing",
    description="Atualiza os campos enviados. Registros deletados não podem ser editados.",
)
def update_pricing(
    record_id: str,
    payload: PricingHistoryUpdate,
    request: Request,
    current_user: UsuarioResponse = Depends(require_role("pricing", "admin")),
):
    record = PricingService.update(
        record_id,
        payload,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return PricingHistoryRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  DELETE /pricing/history/{id}                                        #
#  Apenas admin pode deletar                                           #
# ------------------------------------------------------------------ #
 
@router.delete(
    "/history/{record_id}",
    response_model=MessageResponse,
    summary="Deletar registro de pricing (soft delete)",
)
def delete_pricing(
    record_id: str,
    request: Request,
    current_user: UsuarioResponse = Depends(require_role("pricing", "admin")),
):
    return PricingService.soft_delete(
        record_id,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )