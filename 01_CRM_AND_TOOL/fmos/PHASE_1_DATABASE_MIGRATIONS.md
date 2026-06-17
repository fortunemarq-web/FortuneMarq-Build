> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# PHASE 1 — Database Migrations & Type Regeneration
**Priority: CRITICAL — Do this first. Everything else depends on it.**
**Estimated effort: 30–60 minutes**

---

## Objective
Three SQL migrations are missing or untracked. Until these are run in Supabase, roughly 40% of the app's writes silently fail because the tables/columns don't exist. After running all migrations, regenerate the TypeScript types so the compiler catches errors correctly.

---

## Step 1 — Create the `outreach_logs` table

This table is the single most critical missing piece. All telecaller outcome logging, PDF send logs, WhatsApp send logs, and the admin dashboard telecaller activity stats all write to and read from this table. It does NOT exist in the database yet — there is no migration file for it.

**Create this file:** `supabase/migrations/phase_c_outreach_logs.sql`

```sql
-- outreach_logs: tracks every touch in the outreach sequence
-- (calls, WhatsApp sends, PDF sends, follow-ups)

CREATE TABLE IF NOT EXISTS outreach_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  touch_type  TEXT        NOT NULL,
  -- touch_type values: 'call', 'whatsapp_sent', 'pdf_sent', 'follow_up', 'meeting_booked', 'email_sent'
  outcome     TEXT,
  -- outcome values (for calls): 'interested_book', 'interested_follow_up', 'interested_send_info',
  --   'not_interested', 'follow_back', 'wrong_number', 'no_answer'
  pdf_name    TEXT,
  -- pdf_name: the filename of the PDF sent (e.g. "Hubli_Gyms_EN.pdf")
  notes       TEXT,
  actor_id    UUID        REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_outreach_logs_lead_id
  ON outreach_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_created_at
  ON outreach_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_actor_id
  ON outreach_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_touch_type
  ON outreach_logs(touch_type);

-- RLS: telecallers can insert their own logs; admin can read all
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_logs_insert_own"
  ON outreach_logs FOR INSERT
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "outreach_logs_select_own"
  ON outreach_logs FOR SELECT
  USING (actor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
```

**Run this in:** Supabase Dashboard → SQL Editor → New Query → paste → Run.

---

## Step 2 — Run Phase D migrations (proposal + client onboarding tables)

The file `supabase/phase_d_migrations.sql` already exists and is correct. It has NOT been run in Supabase yet. The following tables/columns will be created by it:

- `agreements` table (stores signed agreements)
- `client_onboarding_tasks` table (per-service onboarding checklist)
- `client_asset_vault` table (files/credentials per client)
- `proposals.total_setup` column (ALTER)
- `proposals.total_monthly` column (ALTER)
- `proposals.services` JSONB column (ALTER)
- `proposals.start_date` column (ALTER)
- `proposals.created_by` column (ALTER)
- `whatsapp_templates` table enhancements (ALTER)

**Action:** Open `supabase/phase_d_migrations.sql` → copy entire contents → paste into Supabase SQL Editor → Run.

If any ALTER TABLE statements fail with "column already exists", that's fine — ignore and continue.

---

## Step 3 — Run Phase E migrations (finance + client tier columns)

The file `supabase/phase_e_migrations.sql` already exists and is correct. It has NOT been run yet. The following columns will be created:

- `invoices.revenue_type` TEXT column (values: 'mrr', 'setup', 'one_time')
- `clients.package_tier` TEXT column (values: 'starter', 'growth', 'pro', 'enterprise')
- `clients.services_active` TEXT[] column (array of active service slugs)
- `clients.upsell_eligible` BOOLEAN column

**Action:** Open `supabase/phase_e_migrations.sql` → copy entire contents → paste into Supabase SQL Editor → Run.

---

## Step 4 — Regenerate TypeScript database types

After running all three migrations above, the TypeScript types must be regenerated so the rest of the codebase has accurate type information.

**Run in terminal (from the `fmos/` directory):**
```bash
npx supabase gen types typescript --project-id cnwooodktqwvpzkucskm > types/database.types.ts
```

If you get a login prompt: `npx supabase login` first.

**Verify:** Open `types/database.types.ts` and confirm you can see:
- `outreach_logs` table definition
- `client_onboarding_tasks` table definition
- `invoices` row has `revenue_type` field
- `proposals` row has `total_setup`, `total_monthly`, `services` fields
- `clients` row has `package_tier`, `services_active`, `upsell_eligible` fields

---

## Step 5 — Fix TypeScript errors after type regeneration

After regenerating types, there will likely be TypeScript errors where code used `as any` to bypass missing types. Search the codebase for all remaining `as any` casts that are now unnecessary:

```bash
grep -r "as any" app/ components/ lib/ --include="*.tsx" --include="*.ts" -l
```

For each file found, remove the `as any` cast if the type now exists. Leave any `as any` that are legitimately bypassing an edge case.

---

## Verification Checklist

- [ ] `outreach_logs` table visible in Supabase Table Editor
- [ ] `agreements` table visible in Supabase Table Editor
- [ ] `client_onboarding_tasks` table visible in Supabase Table Editor
- [ ] `client_asset_vault` table visible in Supabase Table Editor
- [ ] `invoices` table has `revenue_type` column in Table Editor
- [ ] `proposals` table has `total_setup`, `total_monthly`, `services` columns
- [ ] `clients` table has `package_tier`, `services_active`, `upsell_eligible` columns
- [ ] `types/database.types.ts` reflects all the above
- [ ] `npm run build` completes with zero type errors related to missing columns

---

## Notes for Antigravity
- Do NOT skip Step 1 — the entire app's outreach tracking depends on this table existing.
- Steps 2 and 3 are existing SQL files — just run them as-is.
- After Step 4, do a full `npm run build` to surface any type errors introduced by the regeneration.
- Do NOT modify `types/database.types.ts` manually — always regenerate from Supabase CLI.
