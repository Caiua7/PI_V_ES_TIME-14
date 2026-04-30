-- ============================================================
-- Migration: Pricing History, Depara Mappings e Audit Logs
-- Responsável: Pessoa 2 - Mateus
-- Executar via: supabase db push
-- ============================================================

-- ============================================================
-- TABELA: pricing_history
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente         VARCHAR(180)    NOT NULL,
    sku             VARCHAR(100)    NOT NULL,
    datasul_code    VARCHAR(100)    NULL,

    category        VARCHAR(120)    NOT NULL,
    subcategory     VARCHAR(120)    NOT NULL,
    size            VARCHAR(60)     NULL,

    manager         VARCHAR(120)    NULL,
    channel         VARCHAR(60)     NULL,

    status          VARCHAR(30)     NOT NULL DEFAULT 'Ativo',

    current_price   NUMERIC(14, 2)  NOT NULL,
    previous_price  NUMERIC(14, 2)  NULL,
    cost            NUMERIC(14, 2)  NULL,
    margin          NUMERIC(6, 2)   NULL,

    currency        VARCHAR(10)     NOT NULL DEFAULT 'BRL',
    month           CHAR(7)         NOT NULL,           -- formato YYYY-MM

    updated_at_source DATE          NULL,

    -- Soft delete
    deleted_at      TIMESTAMPTZ     NULL,

    -- Auditoria de quem criou/editou
    -- Referencia auth.users do Supabase (sem FK hard para nao depender de RLS de outro dev)
    created_by      UUID            NULL,
    updated_by      UUID            NULL,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índices de performance para os filtros do GET /pricing/history
CREATE INDEX idx_pricing_cliente       ON pricing_history (cliente);
CREATE INDEX idx_pricing_sku           ON pricing_history (sku);
CREATE INDEX idx_pricing_category      ON pricing_history (category);
CREATE INDEX idx_pricing_subcategory   ON pricing_history (subcategory);
CREATE INDEX idx_pricing_month         ON pricing_history (month);
CREATE INDEX idx_pricing_datasul_code  ON pricing_history (datasul_code);
CREATE INDEX idx_pricing_deleted_at    ON pricing_history (deleted_at);  -- filtra soft delete

-- Trigger para manter updated_at sincronizado automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pricing_history_updated_at
    BEFORE UPDATE ON pricing_history
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABELA: depara_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS depara_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tipo do mapeamento: client | category | subcategory | sku
    mapping_type    VARCHAR(50)     NOT NULL,
    source_value    VARCHAR(200)    NOT NULL,
    target_value    VARCHAR(200)    NOT NULL,

    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,

    created_by      UUID            NULL,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Regra de unicidade: mesmo tipo+source+target não pode repetir
    CONSTRAINT uq_depara UNIQUE (mapping_type, source_value, target_value)
);

CREATE INDEX idx_depara_mapping_type ON depara_mappings (mapping_type);
CREATE INDEX idx_depara_is_active    ON depara_mappings (is_active);

CREATE TRIGGER trg_depara_updated_at
    BEFORE UPDATE ON depara_mappings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABELA: audit_logs
-- Registra eventos críticos de pricing e depara
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id         UUID            NULL,           -- quem executou (auth.users)
    action          VARCHAR(80)     NOT NULL,       -- ex: CREATE_PRICING, DELETE_DEPARA
    resource_type   VARCHAR(80)     NOT NULL,       -- ex: pricing_history, depara_mappings
    resource_id     VARCHAR(80)     NULL,           -- UUID do registro afetado

    request_id      VARCHAR(80)     NOT NULL,       -- rastreio end-to-end

    ip_address      TEXT            NULL,           -- INET não suportado via supabase-py, usar TEXT
    user_agent      TEXT            NULL,

    -- Payload antes/depois da alteração (para pricing e depara)
    metadata        JSONB           NOT NULL DEFAULT '{}'::jsonb,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user_id              ON audit_logs (user_id);
CREATE INDEX idx_audit_resource             ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_created_at           ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_action               ON audit_logs (action);

-- ============================================================
-- RLS (Row Level Security)
-- Ativar mas manter permissivo por ora — Gustavo alinhará as
-- políticas de autenticação quando Auth estiver pronto.
-- ============================================================
ALTER TABLE pricing_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE depara_mappings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Política temporária: permite tudo para service_role (backend)
-- Remover/substituir quando Auth (Pessoa 1) entregar middleware de role
CREATE POLICY "service_role_full_access_pricing"
    ON pricing_history FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_full_access_depara"
    ON depara_mappings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_full_access_audit"
    ON audit_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);