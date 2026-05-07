from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.pricing import PricingHistory
from app.domain.models.schemas.analytics import (
    AnalyticsCardsResponse,
    AnalyticsEvolutionResponse,
    PriceHistoryPoint,
    SkuCardDetail,
    BenchmarkingCardDetail,
    AnalyticsFilters
)

class AnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    def _build_filter_query(self, filters: AnalyticsFilters):
        # A regra de ouro da operação: ignorar registros com soft delete
        query = self.db.query(PricingHistory).filter(PricingHistory.deleted_at.is_(None))
        
        if filters.sku:
            query = query.filter(PricingHistory.sku == filters.sku)
        if filters.category:
            query = query.filter(PricingHistory.category == filters.category)
        if filters.date_from:
            query = query.filter(PricingHistory.month >= filters.date_from)
        if filters.date_to:
            query = query.filter(PricingHistory.month <= filters.date_to)
            
        return query

    def get_evolution(self, filters: AnalyticsFilters) -> AnalyticsEvolutionResponse:
        query = self._build_filter_query(filters)
        
        # Agrupa por mês e delega o cálculo pesado para o banco de dados
        results = (
            query.with_entities(
                PricingHistory.month,
                func.avg(PricingHistory.current_price).label("avg_price"),
                func.avg(PricingHistory.margin).label("avg_margin")
            )
            .group_by(PricingHistory.month)
            .order_by(PricingHistory.month)
            .all()
        )

        series = []
        for row in results:
            series.append(PriceHistoryPoint(
                mes=row.month,
                preco=round(row.avg_price or 0, 2),
                margem=round(row.avg_margin or 0, 2)
            ))

        # Determina o modo de visualização para o frontend
        mode = "sku" if filters.sku else "category" if filters.category else "agregado"

        return AnalyticsEvolutionResponse(mode=mode, series=series)

    def get_cards(self, filters: AnalyticsFilters) -> AnalyticsCardsResponse:
        query = self._build_filter_query(filters)
        
        # Consolida os KPIs principais
        stats = query.with_entities(
            func.count(PricingHistory.id).label("total_registros"),
            func.avg(PricingHistory.current_price).label("preco_medio"),
            func.avg(PricingHistory.margin).label("margem_media")
        ).first()

        sku_visible = bool(filters.sku)
        bench_visible = bool(filters.category)

        return AnalyticsCardsResponse(
            registros_analisados=stats.total_registros or 0,
            preco_medio=round(stats.preco_medio or 0, 2),
            margem_media=round(stats.margem_media or 0, 2),
            variacao_preco=0.0, # Campo preparado para evolução futura (comparação mês a mês)
            sku_card=SkuCardDetail(
                visible=sku_visible, 
                value=filters.sku if sku_visible else None
            ),
            benchmarking_card=BenchmarkingCardDetail(
                visible=bench_visible, 
                value=round(stats.margem_media or 0, 2) if bench_visible else None, 
                category=filters.category if bench_visible else None
            )
        )