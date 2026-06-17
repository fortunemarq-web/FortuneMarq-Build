> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# PHASE 2 — Admin Dashboard Fixes
**Priority: CRITICAL — Jabeer's morning dashboard shows ₹0 for all financial KPIs**
**Estimated effort: 2–3 hours**
**Depends on: Phase 1 complete**

---

## Objective
Fix 8 bugs in `app/admin/page.tsx` that cause wrong data, broken links, and missing sections on the admin dashboard. After these fixes Jabeer's dashboard will show real MRR, correct meetings, working links, and the missing "Follow-ups Due Today" section.

---

## File to edit: `app/admin/page.tsx`

---

## Fix 1 — MRR and Outstanding KPIs always show ₹0

**Problem:** Three queries use `.select("amount")` but the column is named `total_amount` on the `invoices` table.

**Find and fix these three query sections:**

### Query 1 (paid invoices for MRR calc) — find lines like:
```typescript
const { data: invoiceData } = await supabase
  .from("invoices")
  .select("amount")
  .eq("status", "paid")
```
**Change to:**
```typescript
const { data: invoiceData } = await supabase
  .from("invoices")
  .select("total_amount, revenue_type")
  .eq("status", "paid")
```

### Query 2 (outstanding invoices) — find lines like:
```typescript
const { data: outstandingData } = await supabase
  .from("invoices")
  .select("id, amount, status")
  .eq("status", "pending")
```
**Change to:**
```typescript
const { data: outstandingData } = await supabase
  .from("invoices")
  .select("id, total_amount, status")
  .eq("status", "pending")
```

### Query 3 (overdue invoices for action list) — find lines like:
```typescript
const { data: overdueInvoices } = await supabase
  .from("invoices")
  .select("id, amount, created_at, status, client:clients(business_name)")
```
**Change to:**
```typescript
const { data: overdueInvoices } = await supabase
  .from("invoices")
  .select("id, total_amount, due_date, status, client:clients(business_name)")
  .eq("status", "overdue")
```

**Then fix all sum reductions** — find everywhere that uses `.amount` on an invoice object and change to `.total_amount`:
```typescript
// BEFORE
.reduce((sum, i) => sum + (i.amount || 0), 0)
// AFTER
.reduce((sum, i) => sum + (i.total_amount || 0), 0)
```

---

## Fix 2 — Pipeline forecast shows ₹0 (proposals.amount doesn't exist)

**Problem:** Query uses `.select("id, amount, sent_at, lead:leads(...)")` but the column is `monthly_value` (old) and `total_monthly` (new, added in Phase D).

**Find:**
```typescript
const { data: openProposals } = await supabase
  .from("proposals")
  .select("id, amount, sent_at, lead:leads(company_name, phone)")
  .eq("status", "sent")
```
**Change to:**
```typescript
const { data: openProposals } = await supabase
  .from("proposals")
  .select("id, monthly_value, total_monthly, sent_at, lead:leads(id, company_name, phone)")
  .eq("status", "sent")
```

**Then fix the display** — wherever `p.amount` is referenced in the proposals section, change to `p.total_monthly ?? p.monthly_value ?? 0`.

---

## Fix 3 — Overdue invoice "days overdue" calculates from invoice creation date, not due date

**Problem:** `daysSince(inv.created_at)` shows days since invoice was created, not days since it was due.

**Find:**
```typescript
daysSince(inv.created_at)
```
**Change to:**
```typescript
daysSince(inv.due_date)
```

---

## Fix 4 — Meetings query uses `leads.status` instead of `leads.outreach_stage`

**Problem:** `.eq("status", "meeting_booked" as any)` — after Phase 3 telecaller fix, meetings are written to `outreach_stage`. This query will miss them.

**Find:**
```typescript
.eq("status", "meeting_booked" as any)
```
**Change to:**
```typescript
.eq("outreach_stage", "meeting_booked")
```
Remove the `as any` cast.

---

## Fix 5 — "Clients in Onboarding" section shows wrong clients

**Problem:** Queries `status = 'active' AND onboarding_completed = false`. New clients created from agreements are set to `status = 'onboarding'` — they never appear here.

**Find:**
```typescript
.eq("status", "active")
// AND somewhere below:
.eq("onboarding_completed", false)
// or similar filter
```
**Change to:**
```typescript
.eq("status", "onboarding")
```
Remove the `onboarding_completed` filter entirely.

---

## Fix 6 — Add "Follow-ups Due Today" section (currently missing entirely)

**Problem:** The spec requires a section showing leads where Afifa has a follow-up due today. This section is completely missing.

**Step 6a — Add the data query** in the parallel fetch block (alongside the other queries):
```typescript
const { data: followUpsDue } = await supabase
  .from("leads")
  .select("id, company_name, contact_person, phone, city, industry")
  .eq("outreach_stage", "follow_up_due")
  .eq("follow_up_date", new Date().toISOString().split("T")[0])
  .order("company_name")
```

**Step 6b — Add the count** to `totalActionItems`:
```typescript
const totalActionItems =
  (meetingsToday?.length ?? 0) +
  (followUpsDue?.length ?? 0) +   // ADD THIS LINE
  (overdueInvoices?.length ?? 0) +
  (onboardingClients?.length ?? 0)
```

**Step 6c — Add the ActionSection** between "Meetings Today" and "Overdue Invoices":
```tsx
<ActionSection
  title="Follow-ups Due Today"
  count={followUpsDue?.length ?? 0}
  icon={<PhoneCall className="w-4 h-4" />}
  emptyMessage="No follow-ups due today ✓"
>
  {followUpsDue?.map((lead) => (
    <ActionCard key={lead.id}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{lead.company_name}</p>
          <p className="text-xs text-slate-500">{lead.city} · {lead.industry}</p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${lead.phone}`} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
            Call
          </a>
          <a href={`/admin/leads/${lead.id}`} className="text-xs px-2 py-1 bg-slate-100 rounded">
            Profile
          </a>
        </div>
      </div>
    </ActionCard>
  ))}
</ActionSection>
```

---

## Fix 7 — "Open Proposal" button links to wrong route

**Problem:** Links to `/sales/outreach` which doesn't exist for admin.

**Find:**
```typescript
href="/sales/outreach"
```
or
```typescript
href={`/sales/outreach`}
```
**Change to:**
```typescript
href={`/admin/leads/${p.lead?.id}`}
```

---

## Fix 8 — Meetings "Open Lead" links to wrong route

**Problem:** Links to `/sales/leads/${lead.id}` which is the telecaller view, not the admin lead profile.

**Find:**
```typescript
href={`/sales/leads/${lead.id}`}
```
**Change to:**
```typescript
href={`/admin/leads/${lead.id}`}
```

---

## Fix 9 — KPI card numbers use `text-2xl` instead of `text-3xl`

**Find in the KPI card components:**
```typescript
className="text-2xl font-bold"
```
**Change to:**
```typescript
className="text-3xl font-bold"
```
This applies only to the main KPI number values (MRR amount, Outstanding amount, etc.), not to labels.

---

## Fix 10 — Add "All clear ✓" empty states to action sections

**Problem:** When a section has no items it disappears entirely. Jabeer can't tell if it's empty or broken.

For every `ActionSection` that can return zero items, ensure it renders an empty state instead of hiding:

**Pattern to apply to each section:**
```tsx
{items.length === 0 ? (
  <p className="text-xs text-slate-400 py-2 px-1">All clear ✓</p>
) : (
  items.map(item => <ActionCard key={item.id}>...</ActionCard>)
)}
```

Apply this pattern to: Meetings Today, Follow-ups Due Today, Overdue Invoices, Clients in Onboarding.

---

## Verification Checklist

- [ ] MRR KPI card shows a real number (not ₹0)
- [ ] Outstanding KPI card shows a real number (not ₹0)
- [ ] Pipeline forecast in revenue widget shows sent proposals
- [ ] "Follow-ups Due Today" section appears between Meetings and Overdue Invoices
- [ ] Clicking "Open Lead" on a meeting goes to `/admin/leads/[id]`
- [ ] Clicking "Open Proposal" goes to `/admin/leads/[id]`
- [ ] Empty sections show "All clear ✓" text instead of disappearing
- [ ] Overdue invoice shows correct days (from due_date, not created_at)
- [ ] `npm run build` passes with no errors
