-- Seed market_insights for the first niche LP (Stage 2.1): Dental Clinics × Hubli.
-- Numbers from 05_FORTUNEMARQ_ONLINE_PRESENCE/_project_files/Niche_Data_Reference_Sheet.md.
-- 4-bucket split uses the decided default CTR benchmark (35/30/20/15) — not a live
-- SERP scan; re-run "Scan SERP" in /admin/market-insights to replace with measured data.
-- Idempotent: clears any prior Dental Clinics/Hubli row first.

delete from market_insights where industry = 'Dental Clinics' and city = 'Hubli';

insert into market_insights
  (industry, city, search_volume, market_difficulty, pitch_angle, general_insights, competitor_insights)
values (
  'Dental Clinics',
  'Hubli',
  '3,900 searches/mo',
  'Low — top local site captures under a third of demand, zero paid ads in market',
  'B',
  jsonb_build_object(
    'monthlySearchDemand', 3900,
    'isLowVolume', false,
    'topKeywords', jsonb_build_array(
      jsonb_build_object('keyword','dental clinic near me','volume',500),
      jsonb_build_object('keyword','dentist near me','volume',500),
      jsonb_build_object('keyword','best dentist in hubli','volume',300),
      jsonb_build_object('keyword','teeth cleaning hubli','volume',200),
      jsonb_build_object('keyword','dental implants hubli','volume',150)
    )
  ),
  jsonb_build_object(
    'buckets', jsonb_build_object('gmb',35,'directories',30,'realSites',20,'socialOther',15),
    'topResults', jsonb_build_array(
      jsonb_build_object('title','Vishwavande Dental','url','https://vishwavandedental.com','bucket','realSite'),
      jsonb_build_object('title','Jayade Dental World','url','https://jayadedentalworld.com','bucket','realSite'),
      jsonb_build_object('title','Shri Sai Dental Care','url','https://shrisaidentalcare.com','bucket','realSite')
    ),
    'query', 'Dental Clinics in Hubli',
    'scannedAt', '2026-06-17T00:00:00.000Z',
    'totalResults', 10
  )
);
