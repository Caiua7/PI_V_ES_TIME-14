"""
Regras de negócio e queries no Supabase para depara_mappings.
"""
 
from __future__ import annotations
 
from fastapi import HTTPException
 
from app.infrastructure.supabase_client import supabase
from app.models.schemas.depara import DeparaCreate, DeparaFilters
 
TABLE = "depara_mappings"
 
 
class DeparaService:
 
    # ---------------------------------------------------------------- #
    #  POST — criar mapeamento com regra de unicidade                   #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def create(payload: DeparaCreate, user_id: str | None = None) -> dict:
        """
        Insere um novo mapeamento depara.
 
        Regra de unicidade: a combinação (mapping_type, source_value, target_value)
        não pode existir já no banco — independente do is_active.
 
        A constraint UNIQUE está na migration (uq_depara), então o Supabase
        já rejeita duplicatas no banco. Mas verificamos antes para retornar
        um erro legível ao invés de um erro 500 genérico do Postgres.
        """
 
        # Verifica unicidade antes de inserir
        existing = (
            supabase
            .table(TABLE)
            .select("id")
            .eq("mapping_type", payload.mapping_type)
            .eq("source_value", payload.source_value)
            .eq("target_value", payload.target_value)
            .execute()
        )
 
        if existing.data:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Já existe um mapeamento do tipo '{payload.mapping_type}' "
                    f"com source '{payload.source_value}' → target '{payload.target_value}'."
                ),
            )
 
        data = payload.model_dump()
        data["created_by"] = user_id
 
        response = supabase.table(TABLE).insert(data).execute()
 
        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar mapeamento depara.")
 
        return response.data[0]
 
    # ---------------------------------------------------------------- #
    #  GET — listar com filtros                                         #
    # ---------------------------------------------------------------- #
 
    @staticmethod
    def list_mappings(filters: DeparaFilters) -> list[dict]:
        """
        Retorna mapeamentos com filtros opcionais.
        """
        query = supabase.table(TABLE).select("*")
 
        if filters.mapping_type:
            query = query.eq("mapping_type", filters.mapping_type)
 
        if filters.source_value:
            query = query.eq("source_value", filters.source_value)
 
        if filters.target_value:
            query = query.eq("target_value", filters.target_value)
 
        if filters.is_active is not None:
            query = query.eq("is_active", filters.is_active)
 
        query = query.order("mapping_type").order("source_value")
 
        response = query.execute()
        return response.data or []