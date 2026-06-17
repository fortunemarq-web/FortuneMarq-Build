> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# Post-Agreement Flow Audit — Dead Ends & Gaps
**Date:** 2026-06-10
**Scope:** Everything that happens from "client agrees to proposal" onwards, traced through actual code.

---

## PART 1 — THE FLOW AS IT EXISTS TODAY (every button, every step)

### Path A: Lead Profile inline confirm (THE ONLY REACHABLE PATH)
**File:** `app/admin/leads/[id]/lead-profile-admin-client.tsx`

1. Lead profile → Proposals card → proposal with status `sent` shows button **"Client Confirmed →"**
2. Click → inline panel expands:
   - Checkbox: "{company} confirmed verbally or via WhatsApp"
   - Start Date picker
   - Button **"Confirm & Create Client"** (disabled until checkbox ticked)
3. Click "Confirm & Create Client" → runs `confirmProposal()`:
   - Creates `agreements` row with status **`confirmed`** immediately (number `AGR-2026-XXX` from row count)
   - Proposal → status `confirmed`
   - Lead → `outreach_stage: won`, `status: closed_won`
   - Looks up client by exact `business_name`:
     - **Not found** → inserts new client (`status: onboarding`), generates onboarding tasks + asset vault entries per service
     - **Found** → links to existing client, does NOTHING else
   - Redirects to `/admin/clients/{id}?tab=onboarding`

### Path B: Agreement Generator page (ORPHANED — see Gap #2)
**File:** `components/proposals/agreement-generator.tsx` at route `/admin/leads/[id]/proposal/[proposalId]/agreement`

1. Step "confirm": checkbox + start date → **"Generate Agreement Document"** → inserts agreement with status `pending` → step "review"
2. Step "review": full agreement preview + WhatsApp script text box (manual copy, no copy button) → **"Client Confirmed — Create Client & Start Onboarding"**
3. Same client-creation logic as Path A → step "done" ("Deal Closed! 🎉") → redirect to onboarding tab

### After redirect: Client Onboarding Tab
**File:** `components/clients/onboarding-tab.tsx`

- Per-service sections with tasks. Buttons per task: **"▶ Start"** → **"✓ Done"** → **"↺ Reset"**, plus **"✕"** (mark Blocked)
- Assets: **"Mark Requested"** → **"Mark Received"** → **"Mark Stored"**
- When ALL tasks done AND all required assets stored → banner appears with **"Activate Client"** button
- "Activate Client" → client `status: active`, `onboarding_completed: true` → `window.location.reload()` → **flow ends. Nothing happens next.**

### Invoicing (completely disconnected)
**Files:** `components/admin/finance/InvoiceManagerClient.tsx`, `InvoiceCreateModal.tsx`, `app/admin/finance/actions.ts`

- Manual only: Finance → Invoices → **"New Invoice"** → modal (pick client, line items, GST toggle) → `createInvoice()`
- Per invoice: **"Mark Paid"**, **PDF download** (react-pdf), **"Reminder"** button
- No WhatsApp sending anywhere in finance

### Projects (completely disconnected)
- Client profile → Projects tab → link **"New Project"** → `/projects?client={id}` → pm-dashboard "New Project" button → manual creation

### Agreement view pages
- `/admin/agreements` — list with links: View, lead profile, `/admin/clients`
- `/admin/agreements/[id]` — read-only document view. Status badge Pending/Confirmed. **No actions at all.**

---

## PART 2 — DEAD ENDS & GAPS (ranked)

### 🔴 CRITICAL — flow-breaking dead ends

**1. Clients with only WhatsApp Marketing or AI Automations can NEVER be activated.**
`generateClientOnboarding.ts` has task/asset lists only for WEBSITE, GMB, SEO, GOOGLE_ADS, META_ADS. `WHATSAPP_MARKETING` and `AI_AUTOMATIONS` are sellable (in proposals + in onboarding tab's ALL_SERVICES list) but generate **zero tasks**. With 0 tasks, `isComplete` requires `totalTasks > 0` → the "Activate Client" banner never appears → client stuck in `onboarding` status forever.
**Fix:** add SERVICE_TASKS + SERVICE_ASSETS for both services, OR allow manual activation regardless.

**2. The Agreement Generator page is unreachable.**
No link anywhere in the app navigates to `/admin/leads/[id]/proposal/[proposalId]/agreement`. The only live path is the lead-profile inline confirm — which creates the agreement **already confirmed**. Consequence: the real-world step "send agreement to client → wait for 'Yes, confirmed' reply" does not exist in the working flow. There is no moment where the agreement document is actually sent to the client.
**Fix:** add a "Generate & Send Agreement" button on the proposal row (before confirm), and make confirm a separate later action.

**3. After "Activate Client" the flow dead-ends.**
Activation just reloads the page. Nothing prompts: create project, create first invoice, set renewal date, schedule kickoff. Jabeer must remember 3 manual steps in 2 different modules.
**Fix:** post-activation checklist/modal → auto-create project per service + draft setup-fee invoice.

**4. The promised invoice never happens.**
The WhatsApp script sent at agreement time says *"Once confirmed, I'll send across the invoice."* FMOS never creates, reminds about, or sends any invoice after confirmation. Setup-fee invoice must be manually created in Finance with the client manually selected.
**Fix:** on client creation, auto-draft a setup-fee invoice (from `total_setup`) and surface it on the onboarding tab.

**5. Invoice "Reminder" button is fake.**
`InvoiceManagerClient.tsx` line ~192: `onClick={() => alert("Reminder sent via WhatsApp template.")}` — it sends nothing, just shows a browser alert claiming it did. Actively misleading.
**Fix:** wire to wa.me link with reminder text (until WhatsApp API exists), or remove.

**6. Silent failure if onboarding tables don't exist.**
`MIGRATION_ONBOARDING_TABLES.sql` must be run manually in Supabase. `generateClientOnboarding()` has **no error handling** — if tables are missing, inserts fail silently, client is created with an empty onboarding tab, and (per Gap #1 logic) can never be activated. Verify the migration was run.

### 🟠 HIGH — data loss / broken follow-through

**7. Client record gets no phone or email.**
The client insert copies `business_name, owner_name, city, niche` from the lead — **not `phone`**. Once the lead is "won" you work from the client profile, which has no way to contact the client. Every future WhatsApp/call action from the client side is broken.
**Fix:** copy `phone` (and email if present) into the client insert in BOTH confirm paths.

**8. `renewal_date` never set.**
Renewals page queries clients by `renewal_date` — client creation never sets it → no client will ever appear in renewals/upsell tracking.
**Fix:** set `renewal_date = start_date + 1 month` (or contract length) on creation/activation.

**9. Second sale to an existing client does nothing.**
If a client with the same `business_name` exists, the confirm flow links to it but does NOT merge new services into `services_active`, does NOT add onboarding tasks for the new services, does NOT update `monthly_value`. The new deal silently vanishes from client data.
**Fix:** merge services, regenerate onboarding for newly added services, add new monthly value.

**10. No error handling across the 4-step confirm transaction.**
In both paths, proposal update → agreement update → lead update → client insert run sequentially with no checks (except the first insert in Path A). A mid-sequence failure leaves inconsistent state (e.g., lead `won` with no client). If client insert fails, Path B shows "Redirecting…" forever — a literal dead-end screen.
**Fix:** check each step's error; ideally move to a single server action / RPC transaction.

**11. Pending agreements can't be confirmed from anywhere sane.**
The agreement view page (`/admin/agreements/[id]`) is read-only — a `pending` agreement has no "Mark Confirmed" button. And re-opening the (orphaned) generator page would insert a **duplicate** agreement. Pending agreements are stuck.
**Fix:** add "Mark Confirmed" action on agreement view page that runs the same client-creation logic.

**12. Agreement is never actually sent via WhatsApp.**
Generator shows a script in a box — no copy button, no `wa.me` link, no document send. (The planned webhook auto-catch of "Yes, confirmed" also isn't built — blocked on WhatsApp Cloud API.)
**Fix (pre-API):** copy button + wa.me deep link with prefilled text on the review step.

### 🟡 MEDIUM — polish / consistency

**13. Agreement number collision risk** — `AGR-2026-{count+1}` breaks if rows are deleted or two confirms run concurrently. Use a sequence or max+1 on agreement_number.
**14. Dead duplicate component** — `components/admin/clients/tabs/OnboardingTab.tsx` is unused (page imports `components/clients/onboarding-tab.tsx`). Delete to avoid editing the wrong file.
**15. Path A skips agreement review entirely** — agreement content (scope, terms) is never shown to Jabeer or client in the only working path.
**16. `isComplete` requires ALL required assets stored** — a client who never hands over e.g. hosting login blocks activation forever; no override.

---

## PART 3 — RECOMMENDED TARGET FLOW

1. Proposal `sent` → **[Generate Agreement]** → agreement `pending`, preview shown
2. **[Send via WhatsApp]** (wa.me now, API later) → status `sent_to_client`
3. Client replies "Yes, confirmed" → **[Mark Confirmed]** (manual now, webhook later)
4. Confirm → client created **with phone + renewal_date**, services merged if existing, onboarding generated (ALL 7 services covered), **setup-fee invoice auto-drafted**
5. Onboarding tab → tasks/assets → **[Activate Client]**
6. Activation → auto-prompt: create project(s) per service + send setup invoice + set kickoff meeting
7. Invoice paid → **[Mark Paid]** → MRR starts counting; renewal tracking live
