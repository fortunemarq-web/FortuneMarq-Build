-- Migration: Create niche_kits table and storage bucket
-- Task: Niche Kit Manager

-- 1. Create niche_kits table
CREATE TABLE IF NOT EXISTS public.niche_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche_id UUID NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
    market_research_url TEXT,
    case_study_url TEXT,
    landing_page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one kit per niche
    CONSTRAINT unique_niche_kit UNIQUE (niche_id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_niche_kits_niche ON public.niche_kits(niche_id);

-- 3. Enable RLS
ALTER TABLE public.niche_kits ENABLE ROW LEVEL SECURITY;

-- 4. Admin Policies
CREATE POLICY "Admins can manage niche kits" ON public.niche_kits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Anyone authenticated can view niche kits" ON public.niche_kits
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_niche_kits_updated_at
    BEFORE UPDATE ON niche_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Storage buckets are usually created via the Supabase Dashboard, 
-- but we can use SQL for completeness in some environments (though often requires extensions).
-- We'll assume the 'niche-kits' bucket is created manually or via the API.
