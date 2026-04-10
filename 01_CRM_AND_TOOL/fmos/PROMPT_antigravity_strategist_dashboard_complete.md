# Antigravity Prompt: Strategist Dashboard — Complete & Verify

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase
**Scope**: `app/strategist/`, `components/strategist/`

---

## Context

The Strategist Dashboard is the deal-closing interface for senior sales staff. It exists at `/strategist` with a Kanban pipeline and a `/strategist/deals` sub-page. The core files exist but have issues and some documented features are missing or incomplete.

**Read these files fully before making any changes:**
- `app/strategist/page.tsx`
- `app/strategist/deals/page.tsx`
- `components/strategist/strategist-pipeline.tsx`
- `components/strategist/close-deal-modal.tsx`
- `components/strategist/strategy-session-modal.tsx`
- `components/lists/DealsList.tsx`
- `documentation/STRATEGY.md` — the full feature spec

---

## Fix 1 — Auth Client (CRITICAL)

Both strategist pages use `createServerClient()` which does not read cookies and therefore breaks RLS. Fix both:

**`app/strategist/page.tsx`** and **`app/strategist/deals/page.tsx`**:

```typescript
// Before:
import { createServerClient } from "@/lib/supabase";
const supabase = createServerClient();

// After:
import { createServerClientWithCookies } from "@/lib/supabase-server";
const supabase = await createServerClientWithCookies();
```

Make the page function `async` if it isn't already.

---

## Fix 2 — `call_activities` Table Does Not Exist

**File**: `app/strategist/page.tsx`

The query `.from("call_activities")` fails silently because this table doesn't exist. Replace with `lead_outcomes`:

```typescript
const { data: activities, error: activitiesError } = await supabase
  .from("lead_outcomes")
  .select("id, lead_id, outcome, notes, created_at")
  .order("created_at", { ascending: false })
  .limit(200);
if (activitiesError) console.error("lead_outcomes fetch failed:", activitiesError.message);
```

Also remove the `as any[]` cast when passing to the component:
```typescript
// Before:
callActivities={(activities || []) as any[]}
// After:
callActivities={activities || []}
```

---

## Fix 3 — Add Proper Auth Guard to Deals Page

**File**: `app/strategist/deals/page.tsx`

Currently shows `<div>Unauthorized</div>` on auth failure. Improve:

```typescript
import { redirect } from "next/navigation";
// ...
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

---

## Fix 4 — Verify the Close Deal Modal

**File**: `components/strategist/close-deal-modal.tsx`

This is the most critical feature — when a deal is closed it must:
1. Create a row in `clients` table using the lead's company name
2. Insert a row in `deals` table with value, contract link, dates
3. Create one `projects` row per selected service
4. Mark the lead's status as `closed_won`

**Read the file fully**, then verify all four of these actions are implemented. If any are missing:

**Missing client creation:**
```typescript
// Insert into clients table
const { data: newClient, error: clientError } = await supabase
  .from("clients")
  .insert({
    business_name: lead.company_name,
    phone: lead.phone,
    status: "active",
    lead_id: lead.id,
  })
  .select("id")
  .single();
if (clientError) throw new Error(`Client creation failed: ${clientError.message}`);
```

**Missing deal logging:**
```typescript
const { data: newDeal, error: dealError } = await supabase
  .from("deals")
  .insert({
    lead_id: lead.id,
    client_id: newClient.id,
    deal_value: formData.dealValue,
    contract_link: formData.contractLink,
    start_date: formData.startDate,
    deadline: formData.deadline,
    services: formData.selectedServices,
    status: "won",
    closed_by: userId,
  })
  .select("id")
  .single();
if (dealError) throw new Error(`Deal creation failed: ${dealError.message}`);
```

**Missing project provisioning per service:**
```typescript
for (const service of formData.selectedServices) {
  const { error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: newClient.id,
      deal_id: newDeal.id,
      name: `${lead.company_name} — ${service}`,
      service_type: service,
      build_type: service === "Web Dev" ? formData.buildType : null,
      start_date: formData.startDate,
      deadline: formData.deadline,
      status: "not_started",
    });
  if (projectError) throw new Error(`Project creation failed for ${service}: ${projectError.message}`);
}
```

**Missing lead status update:**
```typescript
const { error: leadError } = await supabase
  .from("leads")
  .update({ status: "closed_won" })
  .eq("id", lead.id);
if (leadError) throw new Error(`Lead status update failed: ${leadError.message}`);
```

**Important**: Read the actual column names in `database.types.ts` for `clients`, `deals`, and `projects` tables before writing any insert — use the exact column names from the type definitions.

---

## Fix 5 — Verify Pipeline Stages Match Lead Statuses

**File**: `components/strategist/strategist-pipeline.tsx`

The pipeline Kanban should show leads in these columns based on their `status` value in the `leads` table:

| Column Label | `status` value |
|---|---|
| Qualified | `qualified` |
| Session Booked | `strategy_booked` |
| Closing (Strategy Done) | `strategy_completed` |
| Proposal Req / Sent | `proposal_sent` |
| Contract Signed | `contract_signed` |
| Won (Closed) | `closed_won` |

Check the `STATUS_CONFIG` object in the component and verify it covers all 6 stages. If `proposal_sent` or `contract_signed` stages are missing, add them.

The page currently only fetches `["qualified", "strategy_booked", "strategy_completed"]` — update to include all active stages:

**File**: `app/strategist/page.tsx`

```typescript
const { data: activeLeads, error } = await supabase
  .from("leads")
  .select("*")
  .in("status", [
    "qualified",
    "strategy_booked",
    "strategy_completed",
    "proposal_sent",
    "contract_signed",
  ])
  .order("created_at", { ascending: false });
```

---

## Fix 6 — Dashboard View: "Needs Proposal" and "Needs Contract" Metrics

Per `documentation/STRATEGY.md`, the Dashboard View (one of two tab views) should show:
- **Needs Proposal**: leads in `strategy_completed` status (had meeting, no proposal yet)
- **Needs Contract**: leads where a proposal was sent more than 3 days ago (`proposal_sent` status + `proposal_sent_at < now - 3 days`)

**File**: `app/strategist/page.tsx`

Add these two queries to the page's data fetching:

```typescript
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

const [needsProposalResult, needsContractResult] = await Promise.all([
  supabase
    .from("leads")
    .select("id, company_name, phone, next_action_date")
    .eq("status", "strategy_completed")
    .order("next_action_date", { ascending: true }),

  supabase
    .from("leads")
    .select("id, company_name, phone, proposal_sent_at")
    .eq("status", "proposal_sent")
    .lte("proposal_sent_at", threeDaysAgo)
    .order("proposal_sent_at", { ascending: true }),
]);

if (needsProposalResult.error) console.error("needs_proposal fetch failed:", needsProposalResult.error.message);
if (needsContractResult.error) console.error("needs_contract fetch failed:", needsContractResult.error.message);

const needsProposal = needsProposalResult.data ?? [];
const needsContract = needsContractResult.data ?? [];
```

Pass these to `<StrategistPipeline>` as additional props (`needsProposal`, `needsContract`). The component should render these as action lists in Dashboard View.

---

## Fix 7 — Loss Reason Analysis

Per `documentation/STRATEGY.md`, the Dashboard View should show a breakdown of why deals were lost (from `closedLostLeads` notes).

**File**: `components/strategist/strategist-pipeline.tsx`

In the Dashboard View section, compute a simple loss reason tally from `closedLostLeads`:

```typescript
// In the component, compute:
const lossReasons = closedLostLeads?.reduce((acc, lead) => {
  const notes = (lead.notes ?? "").toLowerCase();
  if (notes.includes("price") || notes.includes("budget")) acc["Price"]++;
  else if (notes.includes("ghost") || notes.includes("no response")) acc["Ghosted"]++;
  else if (notes.includes("competitor")) acc["Competitor"]++;
  else if (notes.includes("not fit") || notes.includes("not interested")) acc["Not a Fit"]++;
  else acc["Other"]++;
  return acc;
}, { "Price": 0, "Ghosted": 0, "Competitor": 0, "Not a Fit": 0, "Other": 0 });
```

Display as simple stat pills in the Dashboard View, e.g. "Price: 3 · Ghosted: 5 · Competitor: 1".

---

## Fix 8 — Amber Highlight for Today's Follow-ups

Per `documentation/STRATEGY.md`, cards should highlight amber when `next_action_date` is today.

**File**: `components/strategist/strategist-pipeline.tsx`

In the lead card rendering, add an amber border/ring if `next_action_date` matches today:

```typescript
const today = new Date().toISOString().split("T")[0];
const isDueToday = lead.next_action_date === today;

// Apply to card className:
className={clsx(
  "...", // existing classes
  isDueToday && "ring-2 ring-amber-400 ring-offset-2"
)}
```

---

## Fix 9 — DealsList Component (`/strategist/deals`)

**File**: `components/lists/DealsList.tsx`

Read this file fully. Verify:
1. It fetches from the `deals` table (with join to `clients` and `leads`)
2. It displays deal value, services, client name, and status
3. It has filtering (open vs closed)

If it's a stub or incomplete, implement it with:
- A table or card list of all deals for the logged-in strategist
- Columns: Client Name | Services | Deal Value (₹) | Status | Closed Date
- Filter buttons: All / Open / Won / Lost
- Query: `supabase.from("deals").select("*, client:clients(business_name), lead:leads(company_name)").order("created_at", { ascending: false })`

---

## Summary of Files to Touch

| File | Action |
|---|---|
| `app/strategist/page.tsx` | Fix auth client, fix call_activities query, add needs_proposal/contract queries, expand .in() status list |
| `app/strategist/deals/page.tsx` | Fix auth client, fix redirect on unauth |
| `components/strategist/strategist-pipeline.tsx` | Verify/add pipeline stages, add amber highlight, add Dashboard View metrics and loss reasons |
| `components/strategist/close-deal-modal.tsx` | Verify and complete the 4-step close deal flow |
| `components/lists/DealsList.tsx` | Verify and complete if stubbed |

---

## Rules

1. Read every target file fully before making any changes
2. Read `database.types.ts` to get exact column names before writing any insert/update
3. Do not change any UI layout or styling — only add missing functionality
4. All Supabase calls must include error destructuring and `console.error` on failure
5. Do not run git commit
6. Run `npx tsc --noEmit` at the end and report exit code and any remaining errors
