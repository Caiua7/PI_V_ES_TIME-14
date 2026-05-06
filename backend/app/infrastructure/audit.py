from __future__ import annotations

import logging
from uuid import uuid4

from app.infrastructure.supabase_client import supabase

_TABLE = "audit_logs"
_logger = logging.getLogger(__name__)


def log_auth_event(
    action: str,
    user_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    request_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    try:
        supabase.table(_TABLE).insert({
            "id": str(uuid4()),
            "user_id": user_id,
            "action": action,
            "resource_type": "auth",
            "request_id": request_id or str(uuid4()),
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": metadata or {},
        }).execute()
    except Exception:
        _logger.exception("audit insert failed: action=%s user_id=%s", action, user_id)
