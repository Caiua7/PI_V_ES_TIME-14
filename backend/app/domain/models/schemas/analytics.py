from pydantic import BaseModel
from list import List

class PricePoint(BaseModel):
    date: str
    price: float

class AnalyticsDashboard(BaseModel):
    total_products: int
    avg_margin: float
    evolution: List[PricePoint]