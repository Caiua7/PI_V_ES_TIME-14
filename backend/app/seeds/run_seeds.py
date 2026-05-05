"""
Runner de Seeds — Homologação
Executa todos os seeds em ordem.
 
Como rodar (da pasta backend/):
    python -m app.seeds.run_seeds
 
Pré-requisitos:
    - backend/.env configurado com SUPABASE_URL e SUPABASE_SERVICE_KEY
    - Tabelas criadas via: supabase db push
"""
 
from __future__ import annotations
 
from app.seeds.seed_depara import run as run_depara
from app.seeds.seed_pricing import run as run_pricing
 
 
def main() -> None:
    print("=" * 55)
    print("  NeoPrice — Seeds de Homologação")
    print("=" * 55)
    print()
 
    run_depara()
    print()
    run_pricing()
 
    print()
    print("=" * 55)
    print("  ✅ Seeds concluídos com sucesso!")
    print("=" * 55)
 
 
if __name__ == "__main__":
    main()