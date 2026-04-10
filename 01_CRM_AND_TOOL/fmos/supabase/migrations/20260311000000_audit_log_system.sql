-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT, -- Denormalized for speed
    user_role TEXT,
    action TEXT NOT NULL, -- 'create' | 'update' | 'delete' | 'login' | 'export' | 'stage_change'
    resource_type TEXT NOT NULL, -- e.g., 'lead', 'client', 'task', 'template', 'niche_kit'
    resource_id UUID,
    resource_label TEXT, -- Human-readable label (e.g. company name)
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins have full access to audit logs"
ON audit_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Deny access to everyone else
CREATE POLICY "Others cannot view audit logs"
ON audit_logs
FOR SELECT
USING (false);
