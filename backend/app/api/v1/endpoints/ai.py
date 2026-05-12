from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.infrastructure.database import get_db
from app.application import ai_service
from app.application.analytics_engine import AnalyticsEngine
from app.domain.models.schemas.analytics import AnalyticsFilters
from app.models.pricing import PricingHistory

router = APIRouter()

class AIRequest(BaseModel):
    question: str

@router.post("/insights")
def get_ai_insights(request: AIRequest, db: Session = Depends(get_db)):
    try:
        engine = AnalyticsEngine(db)
        filtros = AnalyticsFilters()
        
        # 1. Puxar as métricas Macro (KPIs)
        cards_data = engine.get_cards(filtros)
        
        # 2. Puxar o agrupamento de Evolução
        evolution_data = engine.get_evolution(filtros) 
        
        # 3. Puxar os dados brutos (Aumentei para 5000 para garantir cobertura na apresentação)
        raw_data = db.query(PricingHistory).filter(PricingHistory.deleted_at.is_(None)).limit(5000).all()
        
        linhas_detalhadas = []
        for row in raw_data:
            linhas_detalhadas.append(
                f"Data: {row.month} | Cliente: {row.cliente} | Gestora: {row.manager} | Categoria: {row.category} | SKU: {row.sku} | Preço Liquido: R${row.current_price} | Margem: {row.margin}%"
            )
        
        texto_bruto = "\n".join(linhas_detalhadas)

        # 4. A MÁGICA FINAL: O Prompt de Contexto com Dicionário de Dados
        contexto_texto = f"""
        INFORMAÇÕES DO SISTEMA:
        Você está analisando a base de dados de Pricing da empresa. 
        - 'Preço Liquido' refere-se à coluna current_price.
        - 'Gestora' refere-se ao manager da conta.
        - 'SKU' é o código único do produto.
        
        RESUMO DOS KPIS ATUAIS (CARDS DO DASHBOARD):
        {cards_data.model_dump_json()}
        
        DADOS AGREGADOS (MÉDIAS MENSAIS): 
        {evolution_data.model_dump_json()}
        
        DADOS DETALHADOS REAIS (AMOSTRAGEM):
        {texto_bruto}
        """

        # 5. Envia para o Gemini
        resposta = ai_service.generate_pricing_insight(
            user_question=request.question,
            db_context=contexto_texto
        )

        return {"answer": resposta}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no Motor de IA: {str(e)}")