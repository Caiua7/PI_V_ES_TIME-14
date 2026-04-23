# PLANO_FUTURAS_TASKS

Este documento e a referencia principal para implementacao do backend do NeoPrice (Python/FastAPI ou stack equivalente), alinhado com o frontend ja construido.

## 1. Objetivo e Escopo

### Objetivo
- Entregar uma API robusta para autenticacao, gestao de dados de pricing e agregacoes de analytics.
- Substituir completamente os mocks atuais (`authMock`, `mockData`) por integracoes reais sem quebrar a UX existente.
- Garantir seguranca, rastreabilidade e escalabilidade desde o inicio.

### Escopo backend desta fase
- `Auth`: login, cadastro, esqueci senha, refresh de sessao, logout.
- `Pricing Data`: CRUD, filtros combinados, importacao de Excel (assinc), depara.
- `Analytics Aggregation`: series agregadas para preco/margem e cards condicionais.
- `Seguranca`: JWT, hash de senha, rate limit e auditoria.

### Fora de escopo imediato
- Motor de precificacao automatico.
- IA para recomendacao de precos.
- Integracoes com ERP externo em tempo real.

## 2. Arquitetura Sugerida (FastAPI)

### Camadas
- `api/routers`: rotas REST versionadas (`/api/v1/...`).
- `application/services`: regras de negocio.
- `domain/models`: entidades e validacoes.
- `infrastructure/repositories`: acesso a banco.
- `infrastructure/security`: JWT, hash, rate limit, auditoria.
- `jobs/workers`: importacao de Excel e agregacoes assinc.

### Padrao de resposta de erro
- Erros devem seguir payload unico:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Mensagem legivel",
    "details": {}
  },
  "request_id": "uuid"
}
```

## 3. Integracoes - Endpoints Necessarios

## 3.1 Auth

### `POST /api/v1/auth/register`
- Cria usuario com perfil (`pricing`, `pre-sales`, `cs`).
- Regras:
- Email corporativo permitido por dominio definido.
- Senha com politica minima.

### `POST /api/v1/auth/login`
- Autentica por email/senha.
- Retorna `access_token`, `refresh_token`, perfil e dados basicos.

### `POST /api/v1/auth/forgot-password`
- Gera token de reset (mock de envio agora, email provider depois).
- Sempre retorna resposta neutra para evitar enumeracao de usuarios.

### `POST /api/v1/auth/reset-password`
- Valida token de reset e troca senha.

### `POST /api/v1/auth/refresh`
- Renova `access_token` com `refresh_token`.

### `POST /api/v1/auth/logout`
- Invalida refresh token ativo.

### `GET /api/v1/auth/me`
- Retorna usuario autenticado (dados para header/perfil no frontend).

## 3.2 Pricing Data

### `GET /api/v1/pricing/history`
- Lista com filtros combinados:
- client, sku, category, subcategory, manager, status, datasul_code, date_from, date_to.
- Sem paginacao para manter paridade com tela atual (somente scroll).
- Deve suportar `sort_by` e `sort_order`.

### `POST /api/v1/pricing/history`
- Cria novo registro de preco.

### `PUT /api/v1/pricing/history/{id}`
- Edita registro existente.

### `DELETE /api/v1/pricing/history/{id}`
- Exclui registro (preferencia por soft delete).

### `POST /api/v1/pricing/import-excel`
- Recebe arquivo Excel e cria `import_job`.
- Processamento assinc.

### `GET /api/v1/pricing/import-excel/{job_id}`
- Consulta status do processamento (`pending`, `running`, `success`, `failed`).

### `POST /api/v1/pricing/depara`
- Salva mapeamento origem -> destino (cliente/categoria/subcategoria etc).

### `GET /api/v1/pricing/depara`
- Lista deparas ativos com filtros.

## 3.3 Analytics Aggregation

### `GET /api/v1/analytics/evolution`
- Retorna series para graficos de `preco` e `margem`.
- Entrada:
- filtros (client, sku, category, subcategory, datasul_code, periodo).
- Regras:
- com SKU: retorno detalhado por SKU.
- sem SKU: retorno medio agregado.

### `GET /api/v1/analytics/cards`
- Retorna KPIs e cards condicionais.
- Deve calcular:
- registros analisados,
- preco medio,
- margem media,
- sku por datasul_code (quando houver),
- benchmarking por categoria (quando houver category selecionada).

## 4. Banco de Dados (PostgreSQL/Supabase)

## 4.1 Tabelas Principais

### `users`
- `id UUID PK`
- `nome VARCHAR(150) NOT NULL`
- `sobrenome VARCHAR(150) NULL`
- `email VARCHAR(180) UNIQUE NOT NULL`
- `senha_hash VARCHAR(255) NOT NULL`
- `role VARCHAR(20) NOT NULL CHECK (role IN ('pricing','pre-sales','cs','admin'))`
- `area VARCHAR(100) NULL`
- `is_active BOOLEAN DEFAULT TRUE`
- `last_login_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `refresh_tokens`
- `id UUID PK`
- `user_id UUID NOT NULL FK users(id)`
- `token_hash VARCHAR(255) NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `revoked_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Indice: (`user_id`, `expires_at`)

### `password_reset_tokens`
- `id UUID PK`
- `user_id UUID NOT NULL FK users(id)`
- `token_hash VARCHAR(255) NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `used_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `pricing_history`
- `id UUID PK`
- `cliente VARCHAR(180) NOT NULL`
- `sku VARCHAR(100) NOT NULL`
- `datasul_code VARCHAR(100) NULL`
- `category VARCHAR(120) NOT NULL`
- `subcategory VARCHAR(120) NOT NULL`
- `size VARCHAR(60) NULL`
- `manager VARCHAR(120) NULL`
- `channel VARCHAR(60) NULL`
- `status VARCHAR(30) NOT NULL`
- `current_price NUMERIC(14,2) NOT NULL`
- `previous_price NUMERIC(14,2) NULL`
- `cost NUMERIC(14,2) NULL`
- `margin NUMERIC(6,2) NULL`
- `currency VARCHAR(10) NOT NULL DEFAULT 'BRL'`
- `month CHAR(7) NOT NULL` (YYYY-MM)
- `updated_at_source DATE NULL`
- `deleted_at TIMESTAMPTZ NULL` (soft delete)
- `created_by UUID NULL FK users(id)`
- `updated_by UUID NULL FK users(id)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Indices: (`cliente`), (`sku`), (`category`), (`subcategory`), (`month`), (`datasul_code`)

### `depara_mappings`
- `id UUID PK`
- `mapping_type VARCHAR(50) NOT NULL` (client/category/subcategory/sku)
- `source_value VARCHAR(200) NOT NULL`
- `target_value VARCHAR(200) NOT NULL`
- `is_active BOOLEAN DEFAULT TRUE`
- `created_by UUID FK users(id)`
- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()`
- Unico: (`mapping_type`, `source_value`, `target_value`)

### `import_jobs`
- `id UUID PK`
- `file_name VARCHAR(255) NOT NULL`
- `file_path TEXT NOT NULL`
- `status VARCHAR(20) NOT NULL` (pending/running/success/failed)
- `total_rows INT DEFAULT 0`
- `processed_rows INT DEFAULT 0`
- `error_rows INT DEFAULT 0`
- `error_report_path TEXT NULL`
- `started_at TIMESTAMPTZ NULL`
- `finished_at TIMESTAMPTZ NULL`
- `created_by UUID FK users(id)`
- `created_at TIMESTAMPTZ DEFAULT now()`

### `audit_logs`
- `id UUID PK`
- `user_id UUID NULL FK users(id)`
- `action VARCHAR(80) NOT NULL`
- `resource_type VARCHAR(80) NOT NULL`
- `resource_id VARCHAR(80) NULL`
- `request_id VARCHAR(80) NOT NULL`
- `ip_address INET NULL`
- `user_agent TEXT NULL`
- `metadata JSONB DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ DEFAULT now()`
- Indices: (`user_id`), (`resource_type`, `resource_id`), (`created_at`)

## 4.2 Politicas Supabase (se utilizado)
- RLS ativo em todas as tabelas sensiveis.
- `users`: leitura apenas do proprio perfil; admin com policy dedicada.
- `pricing_history`: leitura para perfis autenticados; escrita apenas perfis autorizados (`pricing`, `admin`).
- `audit_logs`: somente admin/sistema.

## 5. Seguranca (Obrigatorio)

### JWT
- `access_token` curto (15 min) + `refresh_token` longo (7-30 dias).
- Claims minimas: `sub`, `role`, `email`, `iat`, `exp`, `jti`.
- Chave forte (`HS256` com secret de alta entropia) ou preferencialmente `RS256`.
- Rotacao de refresh token a cada uso.

### Hash de senha
- `argon2id` (preferencial) ou `bcrypt` com custo adequado.
- Nunca salvar senha em texto claro.
- Comparacao em tempo constante.

### Rate Limit
- Auth:
- `POST /auth/login`: 5 req/min por IP + email.
- `POST /auth/forgot-password`: 3 req/min por IP.
- Import:
- `POST /pricing/import-excel`: 2 req/min por usuario.
- Resposta HTTP `429` com `retry_after`.

### Logs de auditoria
- Registrar eventos criticos:
- login sucesso/falha,
- reset de senha,
- create/update/delete em pricing,
- import excel,
- depara alterado.
- Todo log deve conter `request_id` para rastreio.

### Seguranca complementar
- CORS restrito aos dominios permitidos.
- Headers de seguranca (HSTS, X-Content-Type-Options, X-Frame-Options).
- Sanitizacao de entrada e validacao forte com Pydantic.
- Secrets somente em variaveis de ambiente.

## 6. Contratos (JSON Request/Response)

## 6.1 Auth - Login

### Request
```json
{
  "email": "ana@pronutrition.com.br",
  "senha": "123456"
}
```

### Response 200
```json
{
  "access_token": "jwt_access",
  "refresh_token": "jwt_refresh",
  "token_type": "bearer",
  "expires_in": 900,
  "usuario": {
    "id": "uuid",
    "nome": "Ana",
    "email": "ana@pronutrition.com.br",
    "role": "pricing"
  }
}
```

## 6.2 Auth - Register

### Request
```json
{
  "nome": "Bruno",
  "sobrenome": "Silva",
  "area": "Pricing",
  "email": "bruno@pronutrition.com.br",
  "senha": "senha_forte"
}
```

### Response 201
```json
{
  "id": "uuid",
  "nome": "Bruno",
  "email": "bruno@pronutrition.com.br",
  "role": "pricing",
  "created_at": "2026-04-22T10:00:00Z"
}
```

## 6.3 Pricing - Listagem

### Request
`GET /api/v1/pricing/history?client=Atacado%20Norte&sku=SK-1001&category=Proteinas&datasul_code=1001`

### Response 200
```json
{
  "data": [
    {
      "id": "p-001",
      "cliente": "Atacado Norte",
      "sku": "SK-1001",
      "datasul_code": "1001",
      "category": "Proteinas",
      "subcategory": "Whey",
      "size": "1kg",
      "manager": "Ana Pricing",
      "status": "Ativo",
      "current_price": 129.9,
      "previous_price": 119.9,
      "cost": 92.5,
      "margin": 28.8,
      "currency": "BRL",
      "month": "2026-01",
      "updated_at_source": "2026-01-11"
    }
  ],
  "meta": {
    "total": 1,
    "filters_applied": {
      "client": "Atacado Norte",
      "sku": "SK-1001"
    }
  }
}
```

## 6.4 Pricing - Criacao

### Request
```json
{
  "cliente": "Rede Vida",
  "sku": "SK-9999",
  "datasul_code": "9999",
  "category": "Performance",
  "subcategory": "Pre-Treino",
  "size": "300g",
  "manager": "Ana Pricing",
  "status": "Ativo",
  "current_price": 109.9,
  "previous_price": 99.9,
  "cost": 75.0,
  "margin": 31.8,
  "currency": "BRL",
  "month": "2026-05"
}
```

### Response 201
```json
{
  "id": "uuid",
  "message": "Registro criado com sucesso."
}
```

## 6.5 Analytics - Evolution

### Request
`GET /api/v1/analytics/evolution?sku=SK-1001&client=Atacado%20Norte`

### Response 200
```json
{
  "mode": "sku",
  "series": [
    { "mes": "01/2026", "preco": 129.9, "margem": 28.8 },
    { "mes": "02/2026", "preco": 131.2, "margem": 29.1 }
  ]
}
```

## 6.6 Analytics - Cards

### Request
`GET /api/v1/analytics/cards?datasul_code=1001&category=Proteinas`

### Response 200
```json
{
  "registros_analisados": 15,
  "preco_medio": 110.4,
  "margem_media": 30.2,
  "sku_card": {
    "visible": true,
    "value": "SK-1001"
  },
  "benchmarking_card": {
    "visible": true,
    "value": 31.6,
    "category": "Proteinas"
  }
}
```

## 7. Criterios de Aceite por Rota

## 7.1 Auth
- `register`: valida dominio de email, persiste hash, retorna 201 sem senha.
- `login`: retorna tokens validos e perfil; falha retorna 401 padronizado.
- `forgot-password`: nao revela existencia de email; token com exp.
- `reset-password`: invalida token apos uso.
- `refresh`: rotaciona refresh token e invalida anterior.
- `logout`: token de refresh nao pode mais ser reutilizado.

## 7.2 Pricing Data
- `GET /pricing/history`: aplica todos filtros combinados corretamente.
- `POST/PUT/DELETE /pricing/history`: persiste alteracoes e cria log de auditoria.
- `POST /pricing/import-excel`: cria job e atualiza status.
- `POST /pricing/depara`: salva mapping sem duplicidade invalida.

## 7.3 Analytics
- `GET /analytics/evolution`: retorna serie correta para modo com SKU e sem SKU.
- `GET /analytics/cards`: respeita regras condicionais (datasul_code/category).
- Performance aceitavel com base media (>= 100k linhas com indices basicos).

## 8. Priorizacao Recomendada (Roadmap de Implementacao)

### Fase 1 - Auth (Prioridade maxima)
1. Modelagem `users`, `refresh_tokens`, `password_reset_tokens`.
2. Endpoints `register`, `login`, `me`, `refresh`, `logout`.
3. Endpoints `forgot-password` e `reset-password`.
4. Testes de seguranca e rate limit de auth.

### Fase 2 - Pricing Data
1. Modelagem `pricing_history`, `depara_mappings`, `import_jobs`.
2. `GET /pricing/history` com filtros completos.
3. CRUD de `pricing/history`.
4. Importacao Excel assinc e endpoint de status.
5. Auditoria para eventos de pricing.

### Fase 3 - Analytics Aggregation
1. `GET /analytics/evolution`.
2. `GET /analytics/cards` com regras condicionais.
3. Otimizacao SQL (indices/materialized view se necessario).

### Fase 4 - Hardening e Operacao
1. Logs estruturados e observabilidade.
2. Testes E2E (auth + pricing + analytics).
3. Politicas RLS (Supabase) e revisao final de seguranca.

## 8.1 Tasks Faltantes Identificadas (Adicionar ao Backlog)
- [NOVA] Bootstrap do backend: estrutura inicial do projeto, gerenciamento de dependencias e padrao de pastas.
- [NOVA] Migracoes versionadas (Alembic ou equivalente) para todas as tabelas do item 4.
- [NOVA] Endpoint de healthcheck e readiness (`GET /health`, `GET /ready`) para operacao e deploy.
- [NOVA] Seed inicial para ambiente local/homologacao (usuarios, roles, dados minimos de pricing).
- [NOVA] Fila de processamento para importacao Excel (worker + broker) e politica de retry.
- [NOVA] Armazenamento de arquivos de importacao (local/S3) com limpeza e retencao.
- [NOVA] Testes de contrato API (request/response) para garantir compatibilidade com frontend.
- [NOVA] Pipeline CI/CD minimo: lint, testes, migracoes e build de imagem.
- [NOVA] Matriz de permissao por role (quem pode CRUD pricing, depara, import, auditoria).
- [NOVA] Estrategia de idempotencia para import/job (evitar processamento duplicado).

## 8.2 Separacao das Tasks por 4 Pessoas (Execucao Paralela)

### Pessoa 1 - Auth e Seguranca
1. Endpoints `register`, `login`, `me`, `refresh`, `logout`.
2. Endpoints `forgot-password` e `reset-password`.
3. Hash de senha (`argon2id`/`bcrypt`) e rotacao de refresh token.
4. Rate limit para auth + respostas padronizadas de erro.
5. Matriz de permissao por role e middleware de autorizacao.
6. Auditoria de eventos de autenticacao.

### Pessoa 2 - Dados de Pricing e Depara
1. Modelagem e migracoes de `pricing_history` e `depara_mappings`.
2. Para inserts iniciais do banco (seed/homologacao), usar obrigatoriamente o arquivo "/BD - Histórico de preços.xlsx` como fonte oficial dos dados.
3. `GET /pricing/history` com filtros, ordenacao e validacoes.
4. `POST/PUT/DELETE /pricing/history` com soft delete.
5. Endpoints de `depara` (create/list) com regra de unicidade.
6. Logs de auditoria para alteracoes de pricing/depara.
7. Seeds de dados minimos para homologacao.

### Pessoa 3 - Importacao Excel e Jobs
1. Modelagem e migracoes de `import_jobs`.
2. Endpoint `POST /pricing/import-excel` e `GET /pricing/import-excel/{job_id}`.
3. Fila de processamento (worker + broker) com retry.
4. Estrategia de idempotencia para evitar import duplicado.
5. Armazenamento de arquivos (local/S3), retencao e limpeza.
6. Relatorio de erros de importacao e status detalhado.

### Pessoa 4 - Analytics, Qualidade e Operacao
1. `GET /analytics/evolution` (modo SKU e agregado).
2. `GET /analytics/cards` com regras condicionais.
3. Otimizacao de consultas (indices e possivel materialized view).
4. Testes de contrato API (compatibilidade frontend x backend).
5. Testes E2E ponta a ponta (auth + pricing + analytics).
6. Pipeline CI/CD (lint, testes, migracoes) + healthcheck/readiness.

## 8.3 Dependencias Entre Pessoas (Ordem Recomendada)
- Pessoa 1 entrega `Auth` basico primeiro para desbloquear testes autenticados das Pessoas 2, 3 e 4.
- Pessoa 2 e Pessoa 3 trabalham em paralelo apos migracoes base estarem prontas.
- Pessoa 4 inicia com analytics em dados seed e finaliza validacao E2E quando endpoints de pricing/import estiverem estaveis.
- Todos alinham contratos JSON do item 6 antes de iniciar implementacao para evitar retrabalho.

## 9. Definicao de Pronto (DoD) Backend
- Documentacao OpenAPI atualizada.
- Cobertura de testes minimos:
- unitarios para services criticos,
- integracao para rotas principais.
- Nenhum segredo hardcoded.
- Logs de auditoria ativos.
- Rate limit funcional.
- Pipeline CI validando lint, testes e migracoes.

## 10. Checklist de Handoff Frontend <-> Backend
- Confirmar nomenclatura final dos campos JSON.
- Confirmar enums (`role`, `status`) entre times.
- Confirmar codigos de erro e mensagens.
- Confirmar estrategia de autenticacao no cliente (refresh automatico).
- Realizar teste de substituicao mock -> API em ambiente de homologacao.

---

## Resumo Executivo
- Comecar por `Auth`.
- Evoluir para `Pricing Data` com filtros e CRUD.
- Fechar com `Analytics Aggregation`.
- Tratar seguranca e auditoria como requisito obrigatorio desde o primeiro endpoint.
