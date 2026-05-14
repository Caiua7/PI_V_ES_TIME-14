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
- Sugira possíveis anomalias apenas quando houver variações muito discrepantes.
- Destaque concentração de vendas ou preços por cliente.
- Considere comportamento por SKU e gestora quando disponível.
- Priorize síntese executiva em vez de listagem extensa.
- Ao analisar aumento de preço, considere também o impacto na margem.
- Priorize impacto financeiro e comercial nas recomendações.
- Utilize variação percentual média para comparações entre gestoras, categorias e produtos.
- Considere recorrência e contexto histórico antes de sugerir anomalias.
- Se a pergunta for ambígua, explique rapidamente qual critério foi utilizado.
- Quando o usuário mencionar "performance comercial", considere prioritariamente margem, evolução de preços e consistência dos resultados.

DICIONÁRIO DE DADOS:
- cliente = nome do cliente ou canal de venda
- sku = nome completo/descrição do produto
- datasul_code = código interno do produto no ERP Datasul
- category = categoria principal do produto
- subcategory = subcategoria do produto
- size = tamanho, peso ou volumetria do produto
- manager = gestora responsável pela conta
- channel = canal de venda ou distribuição
- status = status do produto/registro (ex: Ativo)
- current_price = preço líquido atual em reais (R$)
- previous_price = preço líquido anterior em reais (R$)
- cost = custo do produto em reais (R$)
- margin = margem percentual do produto
- currency = moeda utilizada no registro
- month = período no formato MM/YYYY

REGRAS DE INTERPRETAÇÃO:
- O campo sku contém o nome completo do produto.
- O usuário pode mencionar apenas parte do nome do produto.
- Considere correspondências parciais e produtos semelhantes.
- Utilize category e subcategory para análises agrupadas.
- Utilize previous_price para identificar aumentos e reduções.
- Utilize margin para análises de rentabilidade.
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