# Pessoa 4: Gráficos e KPIs

from fastapi import APIRouter
from typing import Any

# Criando o roteador que o api.py está procurando
router = APIRouter()

@router.get("/evolution", response_model=Any)
def get_evolution_data():
    """
    Endpoint inicial para os gráficos de evolução de preços.
    Por enquanto retorna apenas um status de teste.
    """
    return {"message": "Analytics Evolution Mock"}

@router.get("/cards", response_model=Any)
def get_card_data():
    """
    Endpoint para os KPIs do topo da página.
    """
    return {"message": "Analytics Cards Mock"}