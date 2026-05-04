"""
Grava logs de auditoria para alterações de pricing e depara.
"""
 
from __future__ import annotations
 
import uuid
from datetime import datetime, timezone
 
from app.infrastructure.supabase_client import supabase
 
TABLE = "audit_logs"
 
 
class AuditService:
 
    @staticmethod
    def log(
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        user_id: str | None = None,
        metadata: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """
        Grava um registro de auditoria.
 
        Parâmetros:
            action        — o que foi feito:  CREATE_PRICING | UPDATE_PRICING |
                                               DELETE_PRICING | CREATE_DEPARA
            resource_type — qual tabela:       pricing_history | depara_mappings
            resource_id   — UUID do registro afetado
            user_id       — quem fez (virá do Auth quando Pessoa 1 entregar)
            metadata      — payload antes/depois da alteração
            ip_address    — IP da requisição
            user_agent    — navegador/cliente da requisição
        """
 
        entry = {
            "id":            str(uuid.uuid4()),
            "user_id":       user_id,
            "action":        action,
            "resource_type": resource_type,
            "resource_id":   str(resource_id) if resource_id else None,
            "request_id":    str(uuid.uuid4()),
            "ip_address":    ip_address,
            "user_agent":    user_agent,
            "metadata":      metadata or {},
            "created_at":    datetime.now(timezone.utc).isoformat(),
        }
 
        # Fire-and-forget — não bloqueia a resposta principal se falhar
        try:
            supabase.table(TABLE).insert(entry).execute()
        except Exception as e:
            print(f"[AUDIT ERROR] Falha ao gravar log de auditoria: {e}")