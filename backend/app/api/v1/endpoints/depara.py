"""
Endpoints — /api/v1/depara
"""
 
from __future__ import annotations
 
from typing import Optional
 
from fastapi import APIRouter, Depends, Query, Request
 
from app.api.dependencies import get_current_user, require_role
from app.application.depara_service import DeparaService
from app.models.schemas.auth import UsuarioResponse
from app.models.schemas.depara import (
    DeparaCreate,
    DeparaFilters,
    DeparaRecord,
    DeparaResponse,
)
 
router = APIRouter()
 
 
# ------------------------------------------------------------------ #
#  POST /depara                                                         #
#  Apenas pricing e admin podem criar mapeamentos                      #
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
    request: Request,
    current_user: UsuarioResponse = Depends(require_role("pricing", "admin")),
):
    record = DeparaService.create(
        payload,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return DeparaRecord(**record)
 
 
# ------------------------------------------------------------------ #
#  GET /depara                                                          #
#  Qualquer usuário autenticado pode listar                            #
# ------------------------------------------------------------------ #
 
@router.get(
    "",
    response_model=DeparaResponse,
    summary="Listar mapeamentos depara",
    description="Retorna mapeamentos com filtros opcionais.",
)
def list_depara(
    mapping_type:  Optional[str]  = Query(None, description="client | category | subcategory | sku"),
    source_value:  Optional[str]  = Query(None),
    target_value:  Optional[str]  = Query(None),
    is_active:     Optional[bool] = Query(None),
    current_user: UsuarioResponse = Depends(get_current_user),
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
 