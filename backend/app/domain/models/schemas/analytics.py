from pydantic import BaseModel, Field
from typing import List, Optional

# --- Estruturas para Evolução de Preços (Gráficos) ---

class PriceHistoryPoint(BaseModel):
    """Representa um ponto único no gráfico de linha"""
    mes: str = Field(..., description="Mês de referência no formato MM/YYYY")
    preco: float = Field(..., description="Preço médio ou específico do período")
    margem: float = Field(..., description="Percentual de margem no período")

class AnalyticsEvolutionResponse(BaseModel):
    """Resposta final para o gráfico de evolução de preços"""
    mode: str = Field(..., description="Modo de visualização: 'sku' ou 'agregado'")
    series: List[PriceHistoryPoint]

# --- Estruturas para os Cards de KPI ---

class SkuCardDetail(BaseModel):
    """Detalhes visíveis apenas quando um código específico é filtrado"""
    visible: bool
    value: Optional[str] = None

class BenchmarkingCardDetail(BaseModel):
    """Comparativo de margem por categoria"""
    visible: bool
    value: Optional[float] = None
    category: Optional[str] = None

class AnalyticsCardsResponse(BaseModel):
    """Resposta para os cards de KPI do topo da página"""
    registros_analisados: int
    preco_medio: float
    margem_media: float
    sku_card: SkuCardDetail
    benchmarking_card: BenchmarkingCardDetail