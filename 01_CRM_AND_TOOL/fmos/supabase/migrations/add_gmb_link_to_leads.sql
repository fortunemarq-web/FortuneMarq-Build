-- Migration: Add gmb_link column to leads table
-- Stores the Google Maps / GBP profile URL scraped from the lead data

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'gmb_link'
    ) THEN
        ALTER TABLE public.leads
        ADD COLUMN gmb_link TEXT;

        COMMENT ON COLUMN public.leads.gmb_link IS 'Google Maps / GBP profile URL for this lead';

        RAISE NOTICE 'Column gmb_link added to leads table';
    ELSE
        RAISE NOTICE 'Column gmb_link already exists in leads table';
    END IF;
END $$;
