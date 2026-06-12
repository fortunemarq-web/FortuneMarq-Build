# PHASE 5 — Proposals, Client Profile & Renewals Fixes
**Priority: HIGH**
**Estimated effort: 2–3 hours**
**Depends on: Phase 1 complete**

---

## Objective
Fix the proposals list page, add missing client profile features (upsell toggle, services chips), and fix the renewals page to show service chips. Also fix the admin briefing page which shows blank lead names.

---

## Fix 1 — Proposals list page queries columns that may not exist yet

**File:** `app/admin/proposals/page.tsx`

**Problem:** The query selects `total_setup`, `total_monthly`, `services` — Phase D columns. If Phase 1 (migrations) is complete these will now exist. If any still fail, add a fallback.

**Verify the query looks like:**
```typescript
const { data: proposals } = await supabase
  .from("proposals")
  .select("id, proposal_number, status, total_setup, total_monthly, monthly_value, onetime_value, created_at, sent_at, services, lead:leads(id, company_name, city, industry)")
  .order("created_at", { ascending: false })
```

**In the display,** show totals with fallbacks:
```typescript
const totalMonthly = proposal.total_monthly ?? proposal.monthly_value ?? 0
const totalSetup = proposal.total_setup ?? proposal.onetime_value ?? 0
```

---

## Fix 2 — Add Upsell Eligible toggle to Client Profile

**File:** `app/admin/clients/[id]/page.tsx` and the Overview tab component

**Problem:** `clients.upsell_eligible` column exists (Phase E) but there is no toggle on the client profile Overview tab.

**Add a toggle in the Overview tab** in the client profile, in the client metadata section alongside Package Tier:

```tsx
{/* Upsell Eligible Toggle */}
<div className="flex items-center justify-between py-2 border-b border-slate-100">
  <div>
    <p className="text-sm font-medium text-slate-700">Upsell Eligible</p>
    <p className="text-xs text-slate-500">Mark if client is ready for an upsell pitch</p>
  </div>
  <button
    onClick={async () => {
      await supabase
        .from("clients")
        .update({ upsell_eligible: !client.upsell_eligible })
        .eq("id", client.id)
      // trigger refresh
      router.refresh()
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      client.upsell_eligible ? "bg-green-500" : "bg-slate-300"
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      client.upsell_eligible ? "translate-x-6" : "translate-x-1"
    }`} />
  </button>
</div>
```

---

## Fix 3 — Add `services_active` chips to Client Profile Overview

**File:** The Overview tab in the client profile

**Problem:** `clients.services_active` (TEXT[]) is populated from the agreement but never displayed on the client profile.

**Add a "Active Services" row** in the client metadata section:
```tsx
{client.services_active && client.services_active.length > 0 && (
  <div className="py-2 border-b border-slate-100">
    <p className="text-xs text-slate-500 mb-1">Active Services</p>
    <div className="flex flex-wrap gap-1">
      {client.services_active.map((service: string) => (
        <span
          key={service}
          className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200"
        >
          {service.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  </div>
)}
```

---

## Fix 4 — Add `services_active` chips to Renewals page cards

**File:** `app/admin/clients/renewals/page.tsx`

**Problem:** The renewals page shows client cards but doesn't display which services are active, making it impossible to see what's up for renewal.

**Find the renewals card component** and add service chips below the client name:
```tsx
{/* Service chips */}
{client.services_active && (
  <div className="flex flex-wrap gap-1 mt-1">
    {client.services_active.map((service: string) => (
      <span
        key={service}
        className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
      >
        {service.replace(/_/g, " ")}
      </span>
    ))}
  </div>
)}
```

**Also update the renewals query** to include `services_active`:
```typescript
.select("id, business_name, city, industry, mrr, package_tier, services_active, contract_end_date, status")
```

---

## Fix 5 — Fix admin briefing page (blank lead names)

**File:** `app/admin/briefing/page.tsx`

**Problem:** Queries `first_name`, `last_name`, `company`, `next_action_date` on the leads table — these columns don't exist. Correct columns are `contact_person`, `company_name`.

**Find:**
```typescript
.select('id, first_name, last_name, company, next_action_date')
```
**Change to:**
```typescript
.select('id, company_name, contact_person, city, industry, phone, outreach_stage, follow_up_date')
```

**Then fix the display** — wherever `lead.company` or `lead.first_name` or `lead.last_name` is used:
```typescript
// BEFORE
{lead.first_name} {lead.last_name} — {lead.company}
// AFTER
{lead.contact_person} — {lead.company_name}
```

Also remove the `☕️` emoji from the page heading — it's inconsistent with the professional app aesthetic.

**Replace `font-mono tabular-nums` on page headings** with the standard heading style used on all other admin pages:
```typescript
// BEFORE
className="text-4xl font-mono tabular-nums font-bold"
// AFTER
className="text-2xl font-bold text-slate-900"
```

---

## Fix 6 — Fix Automations page design violations

**File:** `app/admin/automations/page.tsx`

**Problem 1:** Uses `border border-[#222]` — hardcoded hex color, violates the design system (only `#42CA80` brand green is permitted as a hardcoded hex).

**Find:**
```typescript
border border-[#222]
```
**Change to:**
```typescript
border border-slate-800
```

**Problem 2:** Uses `font-mono tabular-nums` on page title — inconsistent.

**Find:**
```typescript
className="text-4xl font-mono tabular-nums font-bold"
```
**Change to:**
```typescript
className="text-2xl font-bold text-slate-900"
```

---

## Fix 7 — Health score modal and upsell attempt modal: verify they use correct client ID

**Files:**
- `app/admin/clients/health-score-modal.tsx`
- `app/admin/clients/upsell-attempt-modal.tsx`

**Quick check:** Open both files and confirm they pass `client.id` correctly to their Supabase update calls. Confirm neither reads from `client.mrr` without a fallback (the column name might be `monthly_revenue` in your schema). Fix any column name mismatches found.

---

## Verification Checklist

- [ ] Proposals list page loads with correct total_monthly and total_setup values
- [ ] Client profile Overview tab shows an "Upsell Eligible" toggle that saves to DB
- [ ] Client profile Overview tab shows "Active Services" chips for the client's services
- [ ] Renewals page cards show service chips
- [ ] Admin briefing page shows real lead names (company_name and contact_person)
- [ ] Admin briefing page has no emoji in the heading
- [ ] Automations page uses `border-slate-800` not `border-[#222]`
- [ ] `npm run build` passes
