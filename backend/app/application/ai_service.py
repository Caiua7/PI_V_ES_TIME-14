from google import genai
from app.core.config import settings

# Inicializamos o cliente com a chave que está segura no seu config
client = genai.Client(api_key=settings.GEMINI_API_KEY)

def generate_pricing_insight(user_question: str, db_context: str = "") -> str:
    """
    Função core que envia o contexto do banco de dados e a pergunta para o Gemini.
    """
    # Instrução de sistema para o modelo não fugir do personagem
    system_instruction = (
        "Você é um Cientista de Dados Sênior e especialista em Pricing Corporativo. "
        "Seu objetivo é analisar os dados fornecidos e entregar insights acionáveis, diretos e profissionais. "
        f"DADOS DE CONTEXTO ATUAIS: {db_context}\n\n"
    )
    
    prompt_final = f"{system_instruction}Pergunta do usuário: {user_question}"
    
    # Chamada para o modelo mais rápido e eficiente (flash)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt_final
    )
    
    return response.text