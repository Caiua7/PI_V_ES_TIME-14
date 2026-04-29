from sqlalchemy import Column, String, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.infrastructure.database import Base

class PricingHistory(Base):
    __tablename__ = "pricing_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    cliente = Column(String(180), nullable=False)
    sku = Column(String(100), nullable=False)
    datasul_code = Column(String(100), nullable=True)

    category = Column(String(120), nullable=False)
    subcategory = Column(String(120), nullable=False)
    size = Column(String(60), nullable=True)

    manager = Column(String(120), nullable=True)
    channel = Column(String(60), nullable=True)

    status = Column(String(30), nullable=False)

    current_price = Column(Numeric(14, 2), nullable=False)
    previous_price = Column(Numeric(14, 2), nullable=True)
    cost = Column(Numeric(14, 2), nullable=True)
    margin = Column(Numeric(6, 2), nullable=True)

    currency = Column(String(10), default="BRL")
    month = Column(String(7), nullable=False)

    updated_at_source = Column(Date, nullable=True)

    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)