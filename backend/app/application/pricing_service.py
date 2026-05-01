# Filtros de preço e cálculos

from __future__ import annotations
 
from datetime import datetime, timezone
from uuid import UUID
 
from fastapi import HTTPException
 
from app.infrastructure.supabase_client import supabase
from app.models.schemas.pricing import PricingHistoryFilters, PricingHistoryCreate, PricingHistoryUpdate
 
TABLE = "pricing_history"
 
 
class PricingService:
 
    # ---------------------------------------------------------------- #
    #  GET — listar com filtros e ordenação                             #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def list_history(filters: PricingHistoryFilters) -> list[dict]:
        """
        Retorna registros ativos (deleted_at IS NULL) com filtros e ordenação.
        """
        query = (
            supabase
            .table(TABLE)
            .select("*")
            .is_("deleted_at", "null")
        )
 
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
        if filters.date_from:
            query = query.gte("month", filters.date_from)
        if filters.date_to:
            query = query.lte("month", filters.date_to)
 
        ascending = filters.sort_order == "asc"
        query = query.order(filters.sort_by, desc=not ascending)
 
        response = query.execute()
        return response.data or []
 
    # ---------------------------------------------------------------- #
    #  POST — criar novo registro                                       #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def create(payload: PricingHistoryCreate, user_id: str | None = None) -> dict:
        """
        Insere um novo registro em pricing_history.
        """
        data = payload.model_dump()
        data["created_by"] = user_id
        data["updated_by"] = user_id
 
        response = supabase.table(TABLE).insert(data).execute()
 
        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar registro de pricing.")
 
        return response.data[0]
 
    # ---------------------------------------------------------------- #
    #  PUT — atualizar registro existente                               #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def update(record_id: str, payload: PricingHistoryUpdate, user_id: str | None = None) -> dict:
        """
        Atualiza apenas os campos enviados no body.
        Rejeita registros deletados (soft delete).
        """
        # Verifica se existe e não está deletado
        existing = (
            supabase
            .table(TABLE)
            .select("id, deleted_at")
            .eq("id", record_id)
            .execute()
        )
 
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado.")
 
        if existing.data[0].get("deleted_at") is not None:
            raise HTTPException(status_code=400, detail="Registro já foi deletado e não pode ser editado.")
 
        # Só envia os campos que vieram preenchidos no body
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
 
        if not data:
            raise HTTPException(status_code=400, detail="Nenhum campo válido enviado para atualização.")
 
        data["updated_by"] = user_id
 
        response = (
            supabase
            .table(TABLE)
            .update(data)
            .eq("id", record_id)
            .execute()
        )
 
        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao atualizar registro.")
 
        return response.data[0]
 
    # ---------------------------------------------------------------- #
    #  DELETE — soft delete (não apaga, só marca deleted_at)           #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def soft_delete(record_id: str, user_id: str | None = None) -> dict:
        """
        Soft delete: preenche deleted_at com o timestamp atual.
        O registro continua no banco mas some das listagens.
        """
        # Verifica se existe
        existing = (
            supabase
            .table(TABLE)
            .select("id, deleted_at")
            .eq("id", record_id)
            .execute()
        )
 
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado.")
 
        if existing.data[0].get("deleted_at") is not None:
            raise HTTPException(status_code=400, detail="Registro já foi deletado anteriormente.")
 
        now = datetime.now(timezone.utc).isoformat()
 
        response = (
            supabase
            .table(TABLE)
            .update({"deleted_at": now, "updated_by": user_id})
            .eq("id", record_id)
            .execute()
        )
 
        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao deletar registro.")
 
        return {"message": "Registro deletado com sucesso.", "id": record_id}
 