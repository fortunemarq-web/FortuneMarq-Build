-- Task 6: Niche Pipeline (Kanban Board per Niche)

-- 1. Extend leads table with pipeline columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS lead_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pipeline_updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS pipeline_updated_by UUID REFERENCES auth.users(id);

-- Optional: Add check constraint for valid pipeline stages
-- ALTER TABLE public.leads ADD CONSTRAINT check_pipeline_stage 
-- CHECK (pipeline_stage IN ('new', 'called_no_answer', 'called_interested', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'));

-- 2. Create pipeline_stage_history table
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    
    -- Performance index
    CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pipeline_history_lead ON public.pipeline_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_changed_at ON public.pipeline_stage_history(changed_at DESC);

-- 3. Trigger to auto-update pipeline_updated_at
CREATE OR REPLACE FUNCTION update_pipeline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage) THEN
        NEW.pipeline_updated_at = NOW();
        
        -- Automatically log to history if we have a way to know who changed it
        -- Note: changed_by would usually come from auth.uid() in an RLS-enabled update
        INSERT INTO public.pipeline_stage_history (lead_id, from_stage, to_stage, changed_by)
        VALUES (NEW.id, OLD.pipeline_stage, NEW.pipeline_stage, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pipeline_timestamp ON public.leads;
CREATE TRIGGER trg_update_pipeline_timestamp
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_timestamp();

-- Enable RLS
ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins manage pipeline history" ON public.pipeline_stage_history
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Managers manage pipeline history" ON public.pipeline_stage_history
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Telecallers view pipeline history" ON public.pipeline_stage_history
    FOR SELECT USING (TRUE);
