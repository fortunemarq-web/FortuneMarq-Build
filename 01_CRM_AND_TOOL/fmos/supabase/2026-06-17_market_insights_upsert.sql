DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'market_insights'
      AND constraint_name = 'market_insights_industry_city_key'
  ) THEN
    ALTER TABLE market_insights
      ADD CONSTRAINT market_insights_industry_city_key UNIQUE (industry, city);
  END IF;
END $$;
