# Configuração da ligação ao Postgres/Supabase

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings  # <-- A NOSSA PONTE OFICIAL COM O .ENV

# Pegando a URL validada pelo Pydantic
DATABASE_URL = settings.DATABASE_URL

# Config específica pra SQLite (caso alguém do time decida usar no futuro)
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