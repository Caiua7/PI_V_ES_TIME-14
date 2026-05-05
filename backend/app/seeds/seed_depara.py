"""
Seed — depara_mappings
Dados mínimos para homologação.
Executar via: python -m app.seeds.run_seeds
"""
 
from __future__ import annotations
 
from app.infrastructure.supabase_client import supabase
 
TABLE = "depara_mappings"
 
DEPARA_SEED_DATA = [
    # -- Clientes -----------------------------------------------------
    {"mapping_type": "client", "source_value": "Atacado Norte",        "target_value": "ATA-NORTE",    "is_active": True},
    {"mapping_type": "client", "source_value": "Rede Vida",             "target_value": "REDE-VIDA",    "is_active": True},
    {"mapping_type": "client", "source_value": "Suplementos Express",   "target_value": "SUP-EXP",      "is_active": True},
    {"mapping_type": "client", "source_value": "Nutrição Total",        "target_value": "NUT-TOTAL",    "is_active": True},
 
    # -- Categorias ---------------------------------------------------
    {"mapping_type": "category", "source_value": "Proteinas",           "target_value": "PROT",         "is_active": True},
    {"mapping_type": "category", "source_value": "Performance",         "target_value": "PERF",         "is_active": True},
    {"mapping_type": "category", "source_value": "Vitaminas",           "target_value": "VITA",         "is_active": True},
    {"mapping_type": "category", "source_value": "Aminoacidos",         "target_value": "AMIN",         "is_active": True},
 
    # -- Subcategorias ------------------------------------------------
    {"mapping_type": "subcategory", "source_value": "Whey",             "target_value": "WHEY",         "is_active": True},
    {"mapping_type": "subcategory", "source_value": "Whey Isolado",     "target_value": "WHEY-ISO",     "is_active": True},
    {"mapping_type": "subcategory", "source_value": "Pre-Treino",       "target_value": "PRE-TRN",      "is_active": True},
    {"mapping_type": "subcategory", "source_value": "Creatina",         "target_value": "CREAT",        "is_active": True},
    {"mapping_type": "subcategory", "source_value": "BCAA",             "target_value": "BCAA",         "is_active": True},
    {"mapping_type": "subcategory", "source_value": "Multivitaminico",  "target_value": "MULTI-VIT",    "is_active": True},
 
    # -- SKUs ---------------------------------------------------------
    {"mapping_type": "sku", "source_value": "SK-1001",                  "target_value": "WHEY-1KG-001", "is_active": True},
    {"mapping_type": "sku", "source_value": "SK-1002",                  "target_value": "WHEY-2KG-001", "is_active": True},
    {"mapping_type": "sku", "source_value": "SK-9999",                  "target_value": "PRE-300G-001", "is_active": True},
    {"mapping_type": "sku", "source_value": "SK-2001",                  "target_value": "CREAT-300G-001","is_active": True},
]
 
 
def run() -> None:
    print(" Iniciando seed de depara_mappings...")
 
    inseridos = 0
    ignorados = 0
 
    for item in DEPARA_SEED_DATA:
        existing = (
            supabase
            .table(TABLE)
            .select("id")
            .eq("mapping_type", item["mapping_type"])
            .eq("source_value",  item["source_value"])
            .eq("target_value",  item["target_value"])
            .execute()
        )
 
        if existing.data:
            print(f"  ⚠️  Já existe: [{item['mapping_type']}] {item['source_value']} → {item['target_value']}")
            ignorados += 1
            continue
 
        supabase.table(TABLE).insert(item).execute()
        print(f"  ✅ Inserido:  [{item['mapping_type']}] {item['source_value']} → {item['target_value']}")
        inseridos += 1
 
    print(f"\n  depara_mappings: {inseridos} inseridos, {ignorados} ignorados.")