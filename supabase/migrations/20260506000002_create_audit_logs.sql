CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NULL,
    action          VARCHAR(80) NOT NULL,
    resource_type   VARCHAR(80) NOT NULL,
    resource_id     VARCHAR(80) NULL,
    request_id      VARCHAR(80) NOT NULL,
    ip_address      INET        NULL,
    user_agent      TEXT        NULL,
    metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user_id         ON audit_logs (user_id);
CREATE INDEX idx_audit_resource        ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_created_at      ON audit_logs (created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_audit_logs"
    ON audit_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
