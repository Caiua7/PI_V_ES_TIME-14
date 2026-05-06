from sqlalchemy.orm import Session
from sqlalchemy import func
# Certifique-se de que o import do modelo PricingHistory está correto conforme a estrutura da Pessoa 2
from app.models.pricing import PricingHistory
from app.domain.models.schemas.analytics import (
    AnalyticsEvolutionResponse, 
    PriceHistoryPoint,
    AnalyticsCardsResponse,
    SkuCardDetail,
    BenchmarkingCardDetail
)

class AnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_evolution(self, sku: str = None, category: str = None) -> AnalyticsEvolutionResponse:
        # Usando os nomes exatos do Schema da Pessoa 2: month, current_price, margin
        query = self.db.query(
            PricingHistory.month.label("mes"),
            func.avg(PricingHistory.current_price).label("preco"),
            func.avg(PricingHistory.margin).label("margem")
        )

        if sku:
            query = query.filter(PricingHistory.sku == sku)
            mode = "sku"
        elif category:
            query = query.filter(PricingHistory.category == category)
            mode = "agregado"
        else:
            mode = "agregado"

        # Agrupamento cronológico por mês (YYYY-MM)
        results = query.group_by(PricingHistory.month).order_by(PricingHistory.month).all()

        series = [
            PriceHistoryPoint(
                mes=r.mes, 
                preco=round(float(r.preco), 2), 
                margem=round(float(r.margem), 2)
            ) for r in results
        ]

        return AnalyticsEvolutionResponse(mode=mode, series=series)

    def get_cards(self, sku: str = None, category: str = None) -> AnalyticsCardsResponse:
        # Lógica para os KPIs usando registros filtrados
        query = self.db.query(
            func.count(PricingHistory.id).label("total"),
            func.avg(PricingHistory.current_price).label("avg_p"),
            func.avg(PricingHistory.margin).label("avg_m")
        )
        
        if sku:
            query = query.filter(PricingHistory.sku == sku)
        if category:
            query = query.filter(PricingHistory.category == category)

        res = query.one()

        return AnalyticsCardsResponse(
            registros_analisados=res.total,
            preco_medio=round(float(res.avg_p or 0), 2),
            margem_media=round(float(res.avg_m or 0), 2),
            sku_card=SkuCardDetail(visible=bool(sku), value=sku),
            benchmarking_card=BenchmarkingCardDetail(
                visible=bool(category), 
                value=31.5, # Exemplo: Valor de benchmark fixo ou vindo de outra lógica
                category=category
            )
        )