from functools import lru_cache
from rapidfuzz import process, fuzz
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


SYSTEM_PROMPT = """Você é um analista sênior de Pricing. Responda sempre em português.

REGRAS DE FORMATO:
- Seja direto: comece pelo dado ou conclusão principal, sem frases introdutórias.
- Use **negrito** para destacar números, percentuais e termos-chave.
- Para comparações ou múltiplos itens, use lista curta (máximo 5 itens).
- Para análises narrativas, use parágrafos curtos (máximo 3).
- Nunca misture lista e parágrafos longos na mesma resposta.
- Inclua sempre 1 recomendação prática ao final, em uma frase.
- Tabelas apenas se o usuário pedir explicitamente.
- Se os dados forem insuficientes, diga em uma frase e sugira o que o usuário pode perguntar.
- O usuário pode mencionar apenas parte do nome de um produto.
- Considere produtos semelhantes no contexto
- Considere apenas os dados fornecidos
- Nunca invente métricas
- Se os dados forem insuficientes, diga isso claramente
- Destaque aumentos e reduções relevantes de preço.
- Ao comparar períodos, informe tendência de crescimento, queda ou estabilidade.
- Priorize diferenças percentuais quando houver comparação.
- Identifique possíveis anomalias de preço.
- Destaque concentração de vendas ou preços por cliente.
- Considere comportamento por SKU e gestora quando disponível.

DICIONÁRIO DE DADOS:
- current_price = Preço Líquido (R$)
- manager = Gestora responsável pela conta
- SKU = código único do produto
- month = período no formato MM/YYYY
- cliente = nome do cliente/canal de venda
"""

def find_best_product_match(
    user_text: str,
    product_names: list[str],
    score_cutoff: int = 60
):
    """
    Encontra o produto mais parecido com o texto digitado.
    """

    result = process.extractOne(
        user_text,
        product_names,
        scorer=fuzz.token_sort_ratio,
        score_cutoff=score_cutoff
    )

    if not result:
        return None

    best_match, score, _ = result

    return {
        "product": best_match,
        "score": score
    }

def generate_pricing_insight(user_question: str, db_context: str = "") -> str:
    """
    Envia o contexto do banco de dados e a pergunta para o Gemini,
    com instrução de resposta concisa e bem formatada.
    """
    prompt_final = (
        f"{SYSTEM_PROMPT}\n\n"
        f"DADOS DE CONTEXTO:\n{db_context}\n\n"
        f"Pergunta: {user_question}"
    )

    response = _get_client().models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt_final
    )

    return response.text or ""