from sqlalchemy import Column, String, Float, DateTime, Integer
from app.infrastructure.database import Base

class PricingHistory(Base):
    __tablename__ = "pricing_history"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String)
    sku = Column(String)
    category = Column(String)
    subcategory = Column(String)
    current_price = Column(Float)
    margin = Column(Float)
    month = Column(String)  # No formato YYYY-MM