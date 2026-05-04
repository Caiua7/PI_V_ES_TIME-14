"""
Schemas Pydantic — Depara Mappings
Validações de entrada e contratos de resposta.
"""
 
from __future__ import annotations
 
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator
 
 
# ------------------------------------------------------------------ #
#  Constantes                                                          #
# ------------------------------------------------------------------ #
 
# Tipos de mapeamento permitidos
ALLOWED_MAPPING_TYPES = {"client", "category", "subcategory", "sku"}
 
 
# ------------------------------------------------------------------ #
#  Create — POST /depara                                               #
# ------------------------------------------------------------------ #
 
class DeparaCreate(BaseModel):
    mapping_type:  str = Field(..., description="Tipo do mapeamento: client | category | subcategory | sku")
    source_value:  str = Field(..., min_length=1, max_length=200, description="Valor de origem (ex: nome no Excel)")
    target_value:  str = Field(..., min_length=1, max_length=200, description="Valor de destino (ex: nome no sistema)")
    is_active:     bool = Field(True, description="Se o mapeamento está ativo")
 
    @field_validator("mapping_type", mode="before")
    @classmethod
    def validate_mapping_type(cls, v: str) -> str:
        if v not in ALLOWED_MAPPING_TYPES:
            raise ValueError(
                f"Tipo inválido. Permitidos: {sorted(ALLOWED_MAPPING_TYPES)}"
            )
        return v
 
    @field_validator("source_value", "target_value", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()
 
 
# ------------------------------------------------------------------ #
#  Filtros — GET /depara                                               #
# ------------------------------------------------------------------ #
 
class DeparaFilters(BaseModel):
    mapping_type:  Optional[str]  = None
    source_value:  Optional[str]  = None
    target_value:  Optional[str]  = None
    is_active:     Optional[bool] = None
 
    @field_validator("mapping_type", mode="before")
    @classmethod
    def validate_mapping_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in ALLOWED_MAPPING_TYPES:
            raise ValueError(
                f"Tipo inválido. Permitidos: {sorted(ALLOWED_MAPPING_TYPES)}"
            )
        return v
 
 
# ------------------------------------------------------------------ #
#  Response — um registro                                              #
# ------------------------------------------------------------------ #
 
class DeparaRecord(BaseModel):
    id:            str
    mapping_type:  str
    source_value:  str
    target_value:  str
    is_active:     bool
    created_by:    Optional[str]
    created_at:    Optional[str]
    updated_at:    Optional[str]
 
    class Config:
        from_attributes = True
 
 
# ------------------------------------------------------------------ #
#  Response — envelope GET                                             #
# ------------------------------------------------------------------ #
 
class DeparaResponse(BaseModel):
    data:  list[DeparaRecord]
    total: int
 
 
# ------------------------------------------------------------------ #
#  Response — DELETE/mensagem simples                                  #
# ------------------------------------------------------------------ #
 
class MessageResponse(BaseModel):
    message: str
    id:      str