from sqlalchemy import Column, String, Float, DateTime, text
from app.infrastructure.database import Base
import datetime

class PricingHistory(Base):
    __tablename__ = "pricing_history"

    # Chave Primária agora é UUID
    id = Column(String, primary_key=True, index=True, server_default=text("gen_random_uuid()"))
    
    # Filtros e Agrupamentos (Com índices para o Analytics rodar rápido)
    cliente = Column(String(180), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    datasul_code = Column(String(100), nullable=True, index=True)
    category = Column(String(120), nullable=False, index=True)
    subcategory = Column(String(120), nullable=False, index=True)
    size = Column(String(60), nullable=True)
    manager = Column(String(120), nullable=True)
    channel = Column(String(60), nullable=True)
    
    status = Column(String(30), nullable=False, default='Ativo')
    
    # Métricas Financeiras
    current_price = Column(Float, nullable=False)
    previous_price = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    margin = Column(Float, nullable=True)
    currency = Column(String(10), nullable=False, default='BRL')
    
    # O mês é essencial para o gráfico de evolução
    month = Column(String(7), nullable=False, index=True) 
    
    # Auditoria e Controle
    updated_at_source = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True, index=True) # Importante para ignorar no Analytics
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)