# Filtros de preço e cálculos

from __future__ import annotations
 
from app.infrastructure.supabase_client import supabase
from app.models.schemas.pricing import PricingHistoryFilters
 
 
TABLE = "pricing_history"
 
 
class PricingService:
 
    @staticmethod
    def list_history(filters: PricingHistoryFilters) -> list[dict]:
        """
        Retorna registros de pricing_history aplicando:
        - Filtros combinados (client, sku, category, subcategory,
          manager, status, datasul_code, date_from, date_to)
        - Exclusão de soft deleted (deleted_at IS NULL)
        - Ordenação por sort_by / sort_order
        """
 
        query = (
            supabase
            .table(TABLE)
            .select("*")
            .is_("deleted_at", "null")   # exclui soft deleted
        )
 
        # ── Filtros exatos ────────────────────────────────────────── #
        if filters.client:
            query = query.eq("cliente", filters.client)
 
        if filters.sku:
            query = query.eq("sku", filters.sku)
 
        if filters.category:
            query = query.eq("category", filters.category)
 
        if filters.subcategory:
            query = query.eq("subcategory", filters.subcategory)
 
        if filters.manager:
            query = query.eq("manager", filters.manager)
 
        if filters.status:
            query = query.eq("status", filters.status)
 
        if filters.datasul_code:
            query = query.eq("datasul_code", filters.datasul_code)
 
        # ── Filtros de período (month YYYY-MM) ────────────────────── #
        if filters.date_from:
            query = query.gte("month", filters.date_from)
 
        if filters.date_to:
            query = query.lte("month", filters.date_to)
 
        # ── Ordenação ─────────────────────────────────────────────── #
        ascending = filters.sort_order == "asc"
        query = query.order(filters.sort_by, desc=not ascending)
 
        response = query.execute()
        return response.data or []