-- Add competitor_insights JSONB column to market_insights.
-- Stores SERP bucket breakdown + top 10 results per niche × city.
-- Safe to run even if column already exists (IF NOT EXISTS on the DO block).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'market_insights' AND column_name = 'competitor_insights'
  ) THEN
    ALTER TABLE market_insights ADD COLUMN competitor_insights JSONB;
  END IF;
END $$;
