-- Ensure market_insights has a unique constraint on (industry, city)
-- so the keyword-ingest upsert (onConflict: "industry,city") works.
-- Safe to run even if the constraint already exists.

ALTER TABLE market_insights
  ADD CONSTRAINT IF NOT EXISTS market_insights_industry_city_key
  UNIQUE (industry, city);
