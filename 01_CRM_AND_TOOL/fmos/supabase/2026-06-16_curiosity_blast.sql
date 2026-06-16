-- Stage-3 Niche Curiosity Batch-Send — schema additions
-- Run in the Supabase SQL editor (Chrome FM profile → dashboard). Idempotent.
--
-- 1. Lead-level WhatsApp opt-out (honored by lib/whatsapp/recipients.ts isOptedOut()
--    and set by the webhook on inbound "STOP").
-- 2. report_assets — registry mapping (city, niche, lead_type, lang) → the public
--    Supabase Storage URL of the matching market-intel PDF. Seeded from the 75
--    filenames by actions/report-assets.ts (seedReportAssets).

-- 1 ───────────────────────────────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS wa_opt_out boolean NOT NULL DEFAULT false;

-- 2 ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city        text NOT NULL,            -- e.g. "Hubli" (raw, as in the filename)
  niche_slug  text NOT NULL,            -- raw niche token from filename, e.g. "DentalClinics"
  lead_type   text NOT NULL,            -- 'A' | 'B' | 'C' | 'D'
  lang        text NOT NULL DEFAULT 'en', -- 'en' | 'kn'
  filename    text NOT NULL,
  public_url  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, niche_slug, lead_type, lang)
);

CREATE INDEX IF NOT EXISTS idx_report_assets_lookup
  ON report_assets (city, niche_slug, lang);

-- Storage bucket "market-reports" (public) is created by the seeder via the
-- storage API; no SQL needed. If you prefer SQL, the dashboard Storage UI is simpler.
