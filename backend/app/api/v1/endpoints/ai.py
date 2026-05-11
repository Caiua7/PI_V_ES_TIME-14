from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.infrastructure.database import get_db
# Nota: Pode adicionar a dependência do utilizador atual se quiser trancar a rota com JWT
from app.application import ai_service
from app.application.analytics_engine import AnalyticsEngine
from app.domain.models.schemas.analytics import AnalyticsFilters

router = APIRouter()

# O formato do JSON que o React vai enviar para nós
class AIRequest(BaseModel):
    question: str

@router.post("/insights")
def get_ai_insights(request: AIRequest, db: Session = Depends(get_db)):
    try:
        # 1. Puxar os dados reais para dar contexto à IA
        engine = AnalyticsEngine(db)
        
        filtros = AnalyticsFilters()
        
        # Puxamos a evolução (pode adicionar filtros aqui no futuro)
        evolution_data = engine.get_evolution(filtros) 
        
        # Transformamos os dados num formato de texto para a IA ler
        contexto_texto = f"Estes são os dados atuais de evolução de preços e margens do sistema: {evolution_data}"

        # 2. Chamar o Cérebro (Gemini) passando a pergunta do utilizador e os dados reais
        resposta = ai_service.generate_pricing_insight(
            user_question=request.question,
            db_context=contexto_texto
        )

        # Devolvemos ao React a resposta formatada
        return {"answer": resposta}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no Motor de IA: {str(e)}")