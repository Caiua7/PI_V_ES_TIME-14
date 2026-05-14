from functools import lru_cache

from app.core.config import settings

@lru_cache(maxsize=1)
def _get_client():
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada no backend.")

    try:
        from google import genai
    except Exception as exc:
        raise RuntimeError("Dependência 'google-genai' não instalada no backend.") from exc

    return genai.Client(api_key=api_key)

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
    response = _get_client().models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt_final
    )
    
    return response.text or ""
