# Segurança e validação de tokens
from typing import Generator
from app.infrastructure.database import SessionLocal

def get_db() -> Generator:
    """
    Cria uma nova sessão de banco de dados para cada requisição 
    e a fecha automaticamente após o uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()