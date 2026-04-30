"""
Uso:
    from app.infrastructure.supabase_client import supabase

    result = supabase.table("pricing_history").select("*").execute()

Variáveis de ambiente necessárias (.env):
    SUPABASE_URL=https://<project>.supabase.co
    SUPABASE_SERVICE_KEY=<service_role key>   ← nunca a anon key no backend

"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_SUPABASE_URL = os.getenv("SUPABASE_URL")
_SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not _SUPABASE_URL or not _SUPABASE_KEY:
    raise EnvironmentError(
        "SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no .env"
    )

supabase: Client = create_client(_SUPABASE_URL, _SUPABASE_KEY)