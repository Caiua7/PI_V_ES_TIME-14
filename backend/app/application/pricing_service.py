"""
Regras de negócio e queries no Supabase para pricing_history.
"""
 
from __future__ import annotations
 
from datetime import datetime, timezone
 
from fastapi import HTTPException
 
from app.infrastructure.supabase_client import supabase
from app.application.audit_service import AuditService
from app.models.schemas.pricing import (
    PricingHistoryFilters,
    PricingHistoryCreate,
    PricingHistoryUpdate,
)
 
TABLE = "pricing_history"
 
 
class PricingService:
 
    # ---------------------------------------------------------------- #
    #  GET — listar com filtros e ordenação                             #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def list_history(filters: PricingHistoryFilters) -> list[dict]:
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
    def create(
        payload: PricingHistoryCreate,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        data = payload.model_dump()
        data["created_by"] = user_id
        data["updated_by"] = user_id
 
        response = supabase.table(TABLE).insert(data).execute()
 
        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar registro de pricing.")
 
        record = response.data[0]
 
        # Auditoria — grava o que foi criado no metadata
        AuditService.log(
            action="CREATE_PRICING",
            resource_type="pricing_history",
            resource_id=record["id"],
            user_id=user_id,
            metadata={"created": record},
            ip_address=ip_address,
            user_agent=user_agent,
        )
 
        return record
 
    # ---------------------------------------------------------------- #
    #  PUT — atualizar registro existente                               #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def update(
        record_id: str,
        payload: PricingHistoryUpdate,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        # Busca o estado atual antes de alterar (para gravar no metadata)
        existing = (
            supabase
            .table(TABLE)
            .select("*")
            .eq("id", record_id)
            .execute()
        )
 
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado.")
 
        before = existing.data[0]
 
        if before.get("deleted_at") is not None:
            raise HTTPException(
                status_code=400,
                detail="Registro já foi deletado e não pode ser editado.",
            )
 
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
 
        after = response.data[0]
 
        # Auditoria — grava antes e depois
        AuditService.log(
            action="UPDATE_PRICING",
            resource_type="pricing_history",
            resource_id=record_id,
            user_id=user_id,
            metadata={"before": before, "after": after},
            ip_address=ip_address,
            user_agent=user_agent,
        )
 
        return after
 
    # ---------------------------------------------------------------- #
    #  DELETE — soft delete                                             #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def soft_delete(
        record_id: str,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        existing = (
            supabase
            .table(TABLE)
            .select("*")
            .eq("id", record_id)
            .execute()
        )
 
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado.")
 
        before = existing.data[0]
 
        if before.get("deleted_at") is not None:
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
 
        # Auditoria — grava o estado antes da deleção
        AuditService.log(
            action="DELETE_PRICING",
            resource_type="pricing_history",
            resource_id=record_id,
            user_id=user_id,
            metadata={"deleted": before},
            ip_address=ip_address,
            user_agent=user_agent,
        )
 
        return {"message": "Registro deletado com sucesso.", "id": record_id}