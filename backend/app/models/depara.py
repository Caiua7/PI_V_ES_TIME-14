from sqlalchemy import Column, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.infrastructure.database import Base

class DeparaMapping(Base):
    __tablename__ = "depara_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    mapping_type = Column(String(50), nullable=False)
    source_value = Column(String(200), nullable=False)
    target_value = Column(String(200), nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("mapping_type", "source_value", "target_value", name="uq_depara"),
    )