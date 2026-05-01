"""
Schemas Pydantic — Pricing History
Validações de entrada e contratos de resposta.
"""
 
from __future__ import annotations
 
import re
from typing import Literal, Optional
 
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
#  Filtros — GET /pricing/history                                      #
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
#  Create — POST /pricing/history                                      #
# ------------------------------------------------------------------ #
 
class PricingHistoryCreate(BaseModel):
    cliente:           str             = Field(..., min_length=1, max_length=180)
    sku:               str             = Field(..., min_length=1, max_length=100)
    datasul_code:      Optional[str]   = Field(None, max_length=100)
    category:          str             = Field(..., min_length=1, max_length=120)
    subcategory:       str             = Field(..., min_length=1, max_length=120)
    size:              Optional[str]   = Field(None, max_length=60)
    manager:           Optional[str]   = Field(None, max_length=120)
    channel:           Optional[str]   = Field(None, max_length=60)
    status:            str             = Field("Ativo", max_length=30)
    current_price:     float           = Field(..., gt=0)
    previous_price:    Optional[float] = Field(None, ge=0)
    cost:              Optional[float] = Field(None, ge=0)
    margin:            Optional[float] = None
    currency:          str             = Field("BRL", max_length=10)
    month:             str             = Field(..., description="Formato YYYY-MM")
    updated_at_source: Optional[str]   = None
 
    @field_validator("month", mode="before")
    @classmethod
    def validate_month(cls, v: str) -> str:
        if not MONTH_REGEX.match(v):
            raise ValueError("Formato inválido. Use YYYY-MM (ex: 2026-01)")
        return v
 
    @field_validator("current_price", "previous_price", "cost", mode="before")
    @classmethod
    def round_prices(cls, v):
        if v is not None:
            return round(float(v), 2)
        return v
 
 
# ------------------------------------------------------------------ #
#  Update — PUT /pricing/history/{id}                                  #
#  Todos os campos opcionais — só envia o que quer alterar            #
# ------------------------------------------------------------------ #
 
class PricingHistoryUpdate(BaseModel):
    cliente:           Optional[str]   = Field(None, min_length=1, max_length=180)
    sku:               Optional[str]   = Field(None, min_length=1, max_length=100)
    datasul_code:      Optional[str]   = Field(None, max_length=100)
    category:          Optional[str]   = Field(None, min_length=1, max_length=120)
    subcategory:       Optional[str]   = Field(None, min_length=1, max_length=120)
    size:              Optional[str]   = Field(None, max_length=60)
    manager:           Optional[str]   = Field(None, max_length=120)
    channel:           Optional[str]   = Field(None, max_length=60)
    status:            Optional[str]   = Field(None, max_length=30)
    current_price:     Optional[float] = Field(None, gt=0)
    previous_price:    Optional[float] = Field(None, ge=0)
    cost:              Optional[float] = Field(None, ge=0)
    margin:            Optional[float] = None
    currency:          Optional[str]   = Field(None, max_length=10)
    month:             Optional[str]   = None
    updated_at_source: Optional[str]   = None
 
    @field_validator("month", mode="before")
    @classmethod
    def validate_month(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not MONTH_REGEX.match(v):
            raise ValueError("Formato inválido. Use YYYY-MM (ex: 2026-01)")
        return v
 
 
# ------------------------------------------------------------------ #
#  Response — um registro                                              #
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
#  Response — envelope GET                                             #
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
 
 
# ------------------------------------------------------------------ #
#  Response — DELETE                                                   #
# ------------------------------------------------------------------ #
 
class MessageResponse(BaseModel):
    message: str
    id:      str