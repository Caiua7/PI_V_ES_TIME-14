# Agregação de dados para os gráficos

from datetime import datetime, timedelta

class AnalyticsEngine:
    @staticmethod
    def get_price_evolution(product_id: int):
        # Mock: Simula dados de 7 dias para o gráfico
        return [
            {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), "price": 100 + i}
            for i in range(7)
        ]

    @staticmethod
    def get_kpis():
        # Mock: Simula os cards de destaque
        return {
            "total_products": 150,
            "avg_margin": 22.5,
            "price_alerts": 5
        }