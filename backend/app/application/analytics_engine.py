from collections import defaultdict

from app.infrastructure.supabase_client import supabase
from app.domain.models.schemas.analytics import (
    AnalyticsCardsResponse,
    AnalyticsEvolutionResponse,
    PriceHistoryPoint,
    SkuCardDetail,
    BenchmarkingCardDetail,
    AnalyticsFilters
)

class AnalyticsEngine:
    def __init__(self):
        self._table = "pricing_history"

    def _clean(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned if cleaned else None

    def _normalize_month(self, value: str | None) -> str | None:
        if not value:
            return None
        text = str(value).strip()
        if len(text) >= 7 and text[4] == "-":
            return text[:7]
        return text

    def _fetch_rows(self, filters: AnalyticsFilters) -> list[dict]:
        query = (
            supabase
            .table(self._table)
            .select("month,current_price,margin,sku,cliente,datasul_code,category,subcategory,size,deleted_at")
            .is_("deleted_at", "null")
        )

        client = self._clean(filters.client)
        sku = self._clean(filters.sku)
        datasul_code = self._clean(filters.datasul_code)
        category = self._clean(filters.category)
        subcategory = self._clean(filters.subcategory)
        size = self._clean(filters.size)

        if client:
            try:
                query = query.ilike("cliente", client)
            except AttributeError:
                query = query.eq("cliente", client)
        if sku:
            query = query.eq("sku", sku)
        if datasul_code:
            pattern = f"%{datasul_code}%"
            try:
                query = query.ilike("datasul_code", pattern)
            except AttributeError:
                query = query.like("datasul_code", pattern)
        if category:
            try:
                query = query.ilike("category", category)
            except AttributeError:
                query = query.eq("category", category)
        if subcategory:
            try:
                query = query.ilike("subcategory", subcategory)
            except AttributeError:
                query = query.eq("subcategory", subcategory)
        if size:
            try:
                query = query.ilike("size", size)
            except AttributeError:
                query = query.eq("size", size)

        date_from = self._normalize_month(filters.date_from)
        date_to = self._normalize_month(filters.date_to)
        if date_from:
            query = query.gte("month", date_from)
        if date_to:
            query = query.lte("month", date_to)

        response = query.execute()
        return response.data or []

    def get_evolution(self, filters: AnalyticsFilters) -> AnalyticsEvolutionResponse:
        rows = self._fetch_rows(filters)
        by_month: dict[str, dict[str, float]] = defaultdict(lambda: {"sum_price": 0.0, "sum_margin": 0.0, "count": 0.0})

        for row in rows:
            month = str(row.get("month") or "").strip()
            if not month:
                continue
            price = float(row.get("current_price") or 0)
            margin = float(row.get("margin") or 0)
            by_month[month]["sum_price"] += price
            by_month[month]["sum_margin"] += margin
            by_month[month]["count"] += 1

        series = [
            PriceHistoryPoint(
                mes=month,
                preco=round(agg["sum_price"] / agg["count"], 2) if agg["count"] else 0.0,
                margem=round(agg["sum_margin"] / agg["count"], 2) if agg["count"] else 0.0,
            )
            for month, agg in sorted(by_month.items(), key=lambda item: item[0])
        ]

        # Determina o modo de visualização para o frontend
        mode = "sku" if filters.sku else "category" if filters.category else "agregado"

        return AnalyticsEvolutionResponse(mode=mode, series=series)

    def get_cards(self, filters: AnalyticsFilters) -> AnalyticsCardsResponse:
        rows = self._fetch_rows(filters)
        total = len(rows)
        sum_price = 0.0
        sum_margin = 0.0

        for row in rows:
            sum_price += float(row.get("current_price") or 0)
            sum_margin += float(row.get("margin") or 0)

        preco_medio = (sum_price / total) if total else 0.0
        margem_media = (sum_margin / total) if total else 0.0

        sku_visible = bool(filters.sku)
        bench_visible = bool(filters.category)

        return AnalyticsCardsResponse(
            registros_analisados=total,
            preco_medio=round(preco_medio, 2),
            margem_media=round(margem_media, 2),
            variacao_preco=0.0, # Campo preparado para evolução futura (comparação mês a mês)
            sku_card=SkuCardDetail(
                visible=sku_visible, 
                value=filters.sku if sku_visible else None
            ),
            benchmarking_card=BenchmarkingCardDetail(
                visible=bench_visible, 
                value=round(margem_media, 2) if bench_visible else None,
                category=filters.category if bench_visible else None
            )
        )
