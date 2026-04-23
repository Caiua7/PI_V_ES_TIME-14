# Documento de Integracao Futura Frontend -> Backend
## Objetivo
- Definir contratos e fluxo para conectar o frontend atual (mockado) a backend real com minimo refactor.

## Escopo da Integracao
- Autenticacao: login, cadastro e reset de senha.
- Pricing History: listagem, filtros e criacao de registro.
- Padrao de estados: loading, sucesso e erro.

## Endpoints esperados
### POST `/api/v1/auth/login`
Request:
```json
{
  "email": "pricing@neoprice.com",
  "senha": "SenhaForte123"
}
```
Response 200:
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "user": {
    "id": "u-1",
    "nome": "Ana Pricing",
    "email": "pricing@neoprice.com",
    "areaCargo": "Pricing Manager",
    "role": "pricing"
  }
}
```
Erros: 400, 401, 429.

### POST `/api/v1/auth/register`
Request:
```json
{
  "nome": "Novo Usuario",
  "email": "novo@neoprice.com",
  "senha": "SenhaForte123",
  "areaCargo": "Pricing Analyst"
}
```
Response 201:
```json
{
  "id": "u-10",
  "nome": "Novo Usuario",
  "email": "novo@neoprice.com",
  "areaCargo": "Pricing Analyst",
  "role": "pricing"
}
```
Erros: 400, 409.

### POST `/api/v1/auth/forgot-password`
Request:
```json
{
  "email": "pricing@neoprice.com"
}
```
Response 202:
```json
{
  "message": "Se o e-mail existir, enviaremos o link de recuperacao."
}
```
Erros: 400, 429.

### GET `/api/v1/pricing-history`
Query params: `busca`, `categoria`, `cliente`, `mes`, `page`, `pageSize`.
Response 200:
```json
{
  "items": [
    {
      "id": "p-1",
      "cliente": "Grupo Horizonte",
      "tamanho": "Enterprise",
      "gestora": "Marina Alves",
      "codigo": "GH-001",
      "sku": "SKU-AX1",
      "precoLiquido": 98000,
      "precoBruto": 122000,
      "moeda": "BRL",
      "margemOrcada": 23.5,
      "mes": "2026-01",
      "categoria": "Software",
      "subcategoria": "SaaS Core"
    }
  ],
  "total": 1
}
```
Erros: 400, 401, 500.

### POST `/api/v1/pricing-history`
Request:
```json
{
  "cliente": "Novo Cliente",
  "tamanho": "SMB",
  "gestora": "Renata",
  "codigo": "NC-001",
  "sku": "SKU-NEW",
  "precoLiquido": 10000,
  "precoBruto": 12000,
  "moeda": "BRL",
  "margemOrcada": 20,
  "mes": "2026-04",
  "categoria": "Software",
  "subcategoria": "Addon"
}
```
Response 201:
```json
{
  "item": {
    "id": "p-99",
    "cliente": "Novo Cliente",
    "tamanho": "SMB",
    "gestora": "Renata",
    "codigo": "NC-001",
    "sku": "SKU-NEW",
    "precoLiquido": 10000,
    "precoBruto": 12000,
    "moeda": "BRL",
    "margemOrcada": 20,
    "mes": "2026-04",
    "categoria": "Software",
    "subcategoria": "Addon"
  }
}
```

## Fluxo de autenticacao futuro
1. Front envia credenciais para `/auth/login`.
2. Backend retorna JWT + refresh token.
3. Front injeta `Authorization: Bearer <token>` nas requests protegidas.
4. Ao expirar, refresh token renova sessao.
5. Em `401`, limpar sessao e redirecionar para login.

## Padrao de erro
```json
{
  "code": "AUTH_INVALID",
  "message": "Credenciais invalidas.",
  "status": 401,
  "details": "Opcional"
}
```

## O que trocar para plugar backend
- Substituir implementacoes mock em `src/services/*`.
- Centralizar cliente HTTP com interceptors.
- Persistir sessao de forma segura.
