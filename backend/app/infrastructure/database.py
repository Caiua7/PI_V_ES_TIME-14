# Configuração da ligação ao Postgres/Supabase

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# URL do banco (usa .env se existir)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Config específica pra SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Engine
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base
Base = declarative_base()


# Dependency (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
