# NeoPrice - Frontend MVP (Sem Backend Real)
## Visao geral
Projeto frontend para replicar/adaptar o portal Neo Price.
Nesta entrega, o backend nao foi implementado e todos os dados usam mocks locais.

## Escopo entregue
- Tela de Login
- Tela de Cadastro
- Tela Esqueci Minha Senha
- Tela Pricing Base
- Tela Pricing Dashboard
- Tela Pricing Analytics
- Rotas e navegacao entre todas as telas
- Camada de services/contracts pronta para plug-and-play de backend

## Stack
- React + TypeScript + Vite
- React Router
- React Hook Form + Zod
- Recharts

## Estrutura de pastas
```txt
frontend/
  docs/
    INTEGRACAO_BACKEND.md
  src/
    components/
      layout.tsx
      ui.tsx
    contracts/
      api.ts
    mocks/
      auth.ts
      pricingHistory.ts
    pages/
      auth.tsx
      pricing.tsx
    services/
      authService.ts
      pricingService.ts
    types/
      index.ts
    App.tsx
    router.tsx
    main.tsx
    index.css
```

## Como rodar
1. Entrar na pasta do frontend:
```bash
cd frontend
```
2. Instalar dependencias:
```bash
npm install
```
3. Rodar em desenvolvimento:
```bash
npm run dev
```
4. Executar lint:
```bash
npm run lint
```
5. Gerar build:
```bash
npm run build
```

## Variaveis de ambiente
Baseie seu `.env` no arquivo `.env.example`:
- `VITE_API_BASE_URL`
- `VITE_USE_MOCK`

## Limitacoes desta fase
- Sem backend real
- Sem banco de dados real
- Sem autenticacao real
- Sem endpoints funcionais de API
- Sem autorizacao no servidor

## Pendencias de backend (fase futura)
- Login/cadastro/reset de senha com persistencia real
- Hash de senha e JWT/refresh token
- Criacao do banco e tabelas `users` e `pricing_history`
- Regras de autorizacao por perfil (`pricing`, `pre-sales`, `cs`)
