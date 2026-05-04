"""
Endpoints — /api/v1/depara
Pessoa 2: POST e GET /depara
"""
 
from __future__ import annotations
 
from typing import Optional
 
from fastapi import APIRouter, Header, Query
 
from app.application.depara_service import DeparaService
from app.models.schemas.depara import (
    DeparaCreate,
    DeparaFilters,
    DeparaRecord,
    DeparaResponse,
)
 
router = APIRouter()
 
 
# ------------------------------------------------------------------ #
#  POST /depara                                                         #
# ------------------------------------------------------------------ #
 
@router.post(
    "",
    response_model=DeparaRecord,
    status_code=201,
    summary="Criar mapeamento depara",
    description=(
        "Cria um novo mapeamento de-para. "
        "A combinação (mapping_type + source_value + target_value) deve ser única."
    ),
)
def create_depara(
    payload: DeparaCreate,
    # TODO: substituir por Depends(get_current_user) quando Auth (Pessoa 1) estiver pronto
    x_user_id: Optional[str] = Header(None, description="ID do usuário autenticado"),
):
    record = DeparaService.create(payload, user_id=x_user_id)
    return DeparaRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  GET /depara                                                          #
# ------------------------------------------------------------------ #
 
@router.get(
    "",
    response_model=DeparaResponse,
    summary="Listar mapeamentos depara",
    description="Retorna mapeamentos com filtros opcionais por tipo, source, target e status.",
)
def list_depara(
    mapping_type:  Optional[str]  = Query(None, description="client | category | subcategory | sku"),
    source_value:  Optional[str]  = Query(None, description="Valor de origem"),
    target_value:  Optional[str]  = Query(None, description="Valor de destino"),
    is_active:     Optional[bool] = Query(None, description="Filtrar por status ativo/inativo"),
):
    filters = DeparaFilters(
        mapping_type=mapping_type,
        source_value=source_value,
        target_value=target_value,
        is_active=is_active,
    )
 
    records = DeparaService.list_mappings(filters)
 
    return DeparaResponse(
        data=[DeparaRecord(**r) for r in records],
        total=len(records),
    )