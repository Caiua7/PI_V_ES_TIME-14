# Configuração da ligação ao Postgres/Supabase
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# URL do banco (ajustar depois se precisar)
DATABASE_URL = "sqlite:///./test.db"

# Engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # necessário pro SQLite
)

# Sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os models
Base = declarative_base()


# Dependency para usar nos endpoints (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()