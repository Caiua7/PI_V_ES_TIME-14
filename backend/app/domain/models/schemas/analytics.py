from pydantic import BaseModel, Field
from typing import List, Optional

# --- Estruturas para Evolução de Preços (Gráficos) ---

class PriceHistoryPoint(BaseModel):
    """Representa um ponto único no gráfico de linha/barras"""
    mes: str = Field(..., description="Mês de referência no formato YYYY-MM ou MM/YYYY")
    preco: float = Field(..., description="Preço médio do período")
    margem: float = Field(..., description="Percentual de margem no período")

class AnalyticsEvolutionResponse(BaseModel):
    """Resposta final para o gráfico de evolução"""
    mode: str = Field(..., description="Modo: 'sku', 'category' ou 'agregado'")
    series: List[PriceHistoryPoint]

# --- Estruturas para os Cards de KPI (Topo) ---

class SkuCardDetail(BaseModel):
    visible: bool
    value: Optional[str] = None

class BenchmarkingCardDetail(BaseModel):
    visible: bool
    value: Optional[float] = None
    category: Optional[str] = None

class AnalyticsCardsResponse(BaseModel):
    """KPIs que aparecem nos cards coloridos do Dashboard"""
    registros_analisados: int
    preco_medio: float
    margem_media: float
    variacao_preco: float = Field(0.0, description="Variação percentual vs mês anterior")
    sku_card: SkuCardDetail
    benchmarking_card: BenchmarkingCardDetail

    class Config:
        from_attributes = True
        
class AnalyticsFilters(BaseModel):
    """Filtros aplicados nas rotas de analytics"""
    client: Optional[str] = None
    sku: Optional[str] = None
    datasul_code: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    size: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
