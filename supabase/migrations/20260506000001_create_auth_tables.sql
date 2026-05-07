CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            VARCHAR(150)    NOT NULL,
    sobrenome       VARCHAR(150)    NULL,
    email           VARCHAR(180)    NOT NULL UNIQUE,
    senha_hash      VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'pricing'
                                    CHECK (role IN ('pricing', 'pre-sales', 'cs', 'admin')),
    area            VARCHAR(100)    NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ     NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_user_expires ON refresh_tokens (user_id, expires_at);
CREATE INDEX idx_refresh_token_hash   ON refresh_tokens (token_hash);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reset_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX idx_reset_user_id    ON password_reset_tokens (user_id);

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_users"
    ON users FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_refresh_tokens"
    ON refresh_tokens FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_password_reset_tokens"
    ON password_reset_tokens FOR ALL TO service_role
    USING (true) WITH CHECK (true);
