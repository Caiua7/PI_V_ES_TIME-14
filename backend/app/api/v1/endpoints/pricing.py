# Pessoa 2: CRUD e Histórico

from __future__ import annotations
 
from typing import Optional
 
from fastapi import APIRouter, Query, Header
 
from app.application.pricing_service import PricingService
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
# ------------------------------------------------------------------ #
 
@router.get(
    "/history",
    response_model=PricingHistoryResponse,
    summary="Listar histórico de pricing",
    description="Retorna registros ativos com filtros combinados e ordenação.",
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
    filters = PricingHistoryFilters(
        client=client, sku=sku, category=category, subcategory=subcategory,
        manager=manager, status=status, datasul_code=datasul_code,
        date_from=date_from, date_to=date_to,
        sort_by=sort_by, sort_order=sort_order,
    )
 
    records = PricingService.list_history(filters)
 
    return PricingHistoryResponse(
        data=[PricingHistoryRecord(**r) for r in records],
        meta=PricingHistoryMeta(
            total=len(records),
            filters_applied=FiltersApplied(
                client=client, sku=sku, category=category, subcategory=subcategory,
                manager=manager, status=status, datasul_code=datasul_code,
                date_from=date_from, date_to=date_to,
                sort_by=sort_by, sort_order=sort_order,
            ),
        ),
    )
 
 
# ------------------------------------------------------------------ #
#  POST /pricing/history                                               #
# ------------------------------------------------------------------ #
 
@router.post(
    "/history",
    response_model=PricingHistoryRecord,
    status_code=201,
    summary="Criar registro de pricing",
    description="Insere um novo registro em pricing_history.",
)
def create_pricing(
    payload: PricingHistoryCreate,
    #TODO: esperar Gustavo fazer prara mudar aqui 
    x_user_id: Optional[str] = Header(None, description="ID do usuário autenticado"),
):
    record = PricingService.create(payload, user_id=x_user_id)
    return PricingHistoryRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  PUT /pricing/history/{id}                                           #
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
    #TODO: esperar Gustavo fazer prara mudar aqui 
    x_user_id: Optional[str] = Header(None, description="ID do usuário autenticado"),
):
    record = PricingService.update(record_id, payload, user_id=x_user_id)
    return PricingHistoryRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  DELETE /pricing/history/{id}                                        #
# ------------------------------------------------------------------ #
 
@router.delete(
    "/history/{record_id}",
    response_model=MessageResponse,
    summary="Deletar registro de pricing (soft delete)",
    description=(
        "Soft delete: preenche deleted_at. O registro permanece no banco "
        "mas não aparece nas listagens."
    ),
)
def delete_pricing(
    record_id: str,
    #TODO: esperar Gustavo fazer prara mudar aqui 
    x_user_id: Optional[str] = Header(None, description="ID do usuário autenticado"),
):
    return PricingService.soft_delete(record_id, user_id=x_user_id)
