-- Global Search Indexes
-- Using Postgres Full Text Search for high-performance global search

-- 1. LEADS Search Index
ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS fts_tokens tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(company_name, '') || ' ' || 
    coalesce(contact_person, '') || ' ' || 
    coalesce(phone, '') || ' ' ||
    coalesce(industry, '') || ' ' || 
    coalesce(city, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_leads_fts ON leads USING GIN(fts_tokens);

-- 2. CLIENTS Search Index
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS fts_tokens tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(business_name, '') || ' ' || 
    coalesce(contact_name, '') || ' ' || 
    coalesce(primary_email, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_clients_fts ON clients USING GIN(fts_tokens);

-- 3. PROJECTS Search Index
-- Using service_type as a proxy for name since projects relate directly to services
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS fts_tokens tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(service_type, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN(fts_tokens);

-- 4. TASKS Search Index
ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS fts_tokens tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' ||
    coalesce(sop_content, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_tasks_fts ON tasks USING GIN(fts_tokens);

-- 5. WHATSAPP LOGS Search Index (Message contents)
ALTER TABLE IF EXISTS whatsapp_logs ADD COLUMN IF NOT EXISTS fts_tokens tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(message_sent, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_fts ON whatsapp_logs USING GIN(fts_tokens);
