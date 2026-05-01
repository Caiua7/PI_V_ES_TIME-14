"""
Schemas Pydantic — Pricing History
Validações de entrada e contratos de resposta.
"""
 
from __future__ import annotations
 
import re
from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID
 
from pydantic import BaseModel, Field, field_validator
 
 
# ------------------------------------------------------------------ #
#  Constantes                                                          #
# ------------------------------------------------------------------ #
 
MONTH_REGEX = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
 
ALLOWED_SORT_FIELDS = {
    "cliente", "sku", "category", "subcategory",
    "month", "current_price", "margin", "created_at",
}
 
 
# ------------------------------------------------------------------ #
#  Schema de filtros — query params do GET /pricing/history           #
# ------------------------------------------------------------------ #
 
class PricingHistoryFilters(BaseModel):
    client:        Optional[str] = None
    sku:           Optional[str] = None
    category:      Optional[str] = None
    subcategory:   Optional[str] = None
    manager:       Optional[str] = None
    status:        Optional[str] = None
    datasul_code:  Optional[str] = None
    date_from:     Optional[str] = Field(None, description="Formato YYYY-MM")
    date_to:       Optional[str] = Field(None, description="Formato YYYY-MM")
    sort_by:       Optional[str] = Field("created_at", description="Campo para ordenação")
    sort_order:    Literal["asc", "desc"] = "desc"
 
    @field_validator("date_from", "date_to", mode="before")
    @classmethod
    def validate_month_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not MONTH_REGEX.match(v):
            raise ValueError("Formato inválido. Use YYYY-MM (ex: 2026-01)")
        return v
 
    @field_validator("sort_by", mode="before")
    @classmethod
    def validate_sort_field(cls, v: str | None) -> str:
        if v is None:
            return "created_at"
        if v not in ALLOWED_SORT_FIELDS:
            raise ValueError(
                f"Campo de ordenação inválido. Permitidos: {sorted(ALLOWED_SORT_FIELDS)}"
            )
        return v
 
 
# ------------------------------------------------------------------ #
#  Schema de resposta — um registro de pricing                        #
# ------------------------------------------------------------------ #
 
class PricingHistoryRecord(BaseModel):
    id:                str
    cliente:           str
    sku:               str
    datasul_code:      Optional[str]
    category:          str
    subcategory:       str
    size:              Optional[str]
    manager:           Optional[str]
    channel:           Optional[str]
    status:            str
    current_price:     float
    previous_price:    Optional[float]
    cost:              Optional[float]
    margin:            Optional[float]
    currency:          str
    month:             str
    updated_at_source: Optional[str]
    created_by:        Optional[str]
    updated_by:        Optional[str]
    created_at:        Optional[str]
    updated_at:        Optional[str]
 
    class Config:
        from_attributes = True
 
 
# ------------------------------------------------------------------ #
#  Schema de resposta — envelope do GET /pricing/history              #
# ------------------------------------------------------------------ #
 
class FiltersApplied(BaseModel):
    client:       Optional[str] = None
    sku:          Optional[str] = None
    category:     Optional[str] = None
    subcategory:  Optional[str] = None
    manager:      Optional[str] = None
    status:       Optional[str] = None
    datasul_code: Optional[str] = None
    date_from:    Optional[str] = None
    date_to:      Optional[str] = None
    sort_by:      Optional[str] = None
    sort_order:   Optional[str] = None
 
 
class PricingHistoryMeta(BaseModel):
    total:           int
    filters_applied: FiltersApplied
 
 
class PricingHistoryResponse(BaseModel):
    data: list[PricingHistoryRecord]
    meta: PricingHistoryMeta
 