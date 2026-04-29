import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text

from app.infrastructure.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    file_name = Column(String, nullable=False)
    file_path = Column(Text, nullable=False)

    status = Column(String, nullable=False, default="pending")

    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)

    error_report_path = Column(Text, nullable=True)

    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)