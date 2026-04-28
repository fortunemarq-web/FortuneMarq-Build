# FMOS — Phase E: Finance Split, Revenue Forecast, Retainer Package System
**Give this file to Antigravity. Execute after Phase D is complete.**

---

## 1. Who You Are and What You're Working On

You are Antigravity — a senior full-stack developer working on **FMOS** (FortuneMarq Operating System), a custom CRM for FortuneMarq Media & Marketing, Hubli, Karnataka.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (`@supabase/ssr v0.8.0`)

**Design:** bg-slate-50 backgrounds, bg-white cards, bg-slate-900 sidebar, `#42CA80` green accent

**App location:** `01_CRM_AND_TOOL/fmos/`

**Read first:**
- `01_CRM_AND_TOOL/fmos/CLAUDE.md`
- `01_CRM_AND_TOOL/fmos/UI_UX_GUIDELINES.md`

---

## 2. SQL Migrations — Run These FIRST

```sql
-- Invoice revenue type
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revenue_type TEXT
  DEFAULT 'mrr'
  CHECK (revenue_type IN ('mrr','setup_fee','one_time'));

-- Client package and upsell tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_tier TEXT
  CHECK (package_tier IN ('starter','growth','pro','custom'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services_active JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_eligible BOOLEAN DEFAULT FALSE;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'revenue_type';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('package_tier','services_active','upsell_eligible');
```

---

## 3. E1 — Finance Module: MRR vs One-Time Revenue Split

### Route
`/admin/finance` — Finance dashboard (already exists)

The Finance module is already built. This phase MODIFIES the existing pages. Read the current files carefully before making changes:
- `app/admin/finance/page.tsx`
- `app/admin/finance/invoices/page.tsx`
- `app/admin/finance/pnl/page.tsx`

---

### 3a. Finance Dashboard KPI Cards — Replace

Remove the current revenue KPI cards and replace with these 5:

| Card | Query | Display |
|---|---|---|
| MRR | `invoices` WHERE revenue_type = 'mrr' AND status = 'paid' AND current month | ₹X,XXX |
| Setup Fees This Month | WHERE revenue_type = 'setup_fee' AND status = 'paid' AND current month | ₹X,XXX |
| One-Time Revenue | WHERE revenue_type = 'one_time' AND status = 'paid' AND current month | ₹X,XXX |
| Total Revenue | MRR + Setup Fees + One-Time | ₹X,XXX |
| Outstanding | WHERE status IN ('unpaid', 'overdue') — sum of amount | ₹X,XXX + invoice count badge |

**"Current month" definition:** WHERE `date_trunc('month', created_at) = date_trunc('month', NOW())`

**If `revenue_type` column is newly added:** Existing invoices will have `revenue_type = 'mrr'` (the default). This means historical MRR figures will include setup fees that were previously recorded. This is acceptable for now — Jabeer will re-tag old invoices manually if needed. Do not retroactively change data.

**Card design:** Same as current KPI cards — bg-white, rounded-xl, border, shadow-sm, 3px top border per card colour.

Suggested colours:
- MRR: `#42CA80` (green)
- Setup Fees: `#3b82f6` (blue)
- One-Time: `#8b5cf6` (purple)
- Total Revenue: `#0f172a` (slate-900)
- Outstanding: `#ef4444` (red)

---

### 3b. MRR Trend Chart

**Location:** Finance dashboard, below the KPI cards

**Replace** any existing revenue trend chart with a monthly MRR line chart.

**Data:** For each of the last 6 months, sum of `invoices.amount` WHERE `revenue_type = 'mrr'` AND `status = 'paid'` AND `date_trunc('month', created_at) = that month`.

**Chart type:** Line chart using Recharts (already installed). Single line in `#42CA80`.

**X-axis:** Month labels (e.g., "Nov", "Dec", "Jan", "Feb", "Mar", "Apr")
**Y-axis:** ₹ values, formatted with `toLocaleString('en-IN')`

**Chart dimensions:** Full width of the finance dashboard content area, height 200–240px.

---

### 3c. Invoice Creation Form — Add Revenue Type

Find the invoice creation form (likely a modal or page at `/admin/finance/invoices`). Add a **Revenue Type** selector to the form.

**Field:** Select / radio group with 3 options:
- Monthly Retainer (MRR) — default selected
- Setup Fee
- One-Time Project

This field maps to `invoices.revenue_type`. Store:
- Monthly Retainer → `'mrr'`
- Setup Fee → `'setup_fee'`
- One-Time Project → `'one_time'`

**Placement:** Add this field immediately after the client selector and before the amount field. Label: "Revenue Type".

---

### 3d. Invoice List Filter

In the invoice list at `/admin/finance/invoices`, add a filter tab or dropdown above the table:

**Filter options:** All Types | Monthly Retainer | Setup Fee | One-Time

Selecting a type filters the table to show only invoices of that `revenue_type`.

If filters already exist on this page, add the Revenue Type as an additional filter alongside them.

---

### 3e. P&L View — Revenue Lines

File: `app/admin/finance/pnl/page.tsx`

In the P&L statement, the revenue section should show three separate lines before the total:

```
REVENUE
  Monthly Retainer (MRR)        ₹X,XXX
  Setup Fees                    ₹X,XXX
  One-Time Projects             ₹X,XXX
  ─────────────────────────────────────
  Total Revenue                 ₹X,XXX

EXPENSES
  [existing expense items]

  Total Expenses                ₹X,XXX
─────────────────────────────────────────
NET PROFIT / LOSS               ₹X,XXX
```

Keep all existing expense logic unchanged. Only modify the revenue section.

---

## 4. E2 — Revenue Forecast Widget

### Location
Right column of the Admin dashboard (`/admin`), below the Telecaller Activity widget added in Phase B.

### What It Is
A widget showing Jabeer his current progress to the ₹50K MRR target and a pipeline-based forecast.

---

### 4a. Widget Content

**Section 1 — Current MRR:**
- Progress bar: current MRR / ₹50,000
- Text: "₹X,XXX / ₹50,000 (XX%)"
- Bar colour: green if >80%, amber if 50–80%, red if <50%
- Data source: same query as the Finance dashboard MRR card (invoices WHERE revenue_type = 'mrr' AND status = 'paid' AND current month)

This replaces / upgrades the "MRR vs Target" widget that was added in Phase B. If Phase B's version already exists, replace it with this more complete version.

**Section 2 — Pipeline Forecast:**
Query: `proposals` WHERE status = 'sent' — get count and sum of `total_monthly`.

Display:
```
Pipeline (sent proposals): X proposals
If all convert: ₹X,XXX additional/month
→ Projected MRR: ₹X,XXX
```

**Section 3 — Conservative Estimate:**
Apply 30% close rate to the pipeline total:
- Adjusted additional = total_pipeline_monthly × 0.30
- Projected conservative = current_mrr + adjusted_additional

Display:
```
Conservative estimate (30% close rate):
→ ₹X,XXX
```
Label "(estimated close rate)" in small grey text below.

**Section 4 — Gap to Target:**
- If current MRR < ₹50,000: "₹X,XXX to go to hit ₹50K MRR target"
- If current MRR >= ₹50,000: "🎯 Target hit! Next milestone: ₹1,00,000 MRR"

**Widget design:** bg-white, rounded-xl, border border-slate-200, shadow-sm, p-4. Section dividers (border-t border-slate-100) between the 4 sections.

---

## 5. E3 — Retainer Package System

### 5a. Package Tier Auto-Calculation

When `clients.services_active` is set (either from agreement creation in Phase D or manually), auto-calculate `package_tier`:

```typescript
function calculatePackageTier(servicesActive: string[]): 'starter' | 'growth' | 'pro' {
  const count = servicesActive.length;
  if (count === 1) return 'starter';
  if (count <= 3) return 'growth';
  return 'pro';
}
```

This function should be called:
1. When a new client is created from an agreement (Phase D)
2. When a client's services are updated in the client profile

Store the result in `clients.package_tier`. If Jabeer manually sets it to 'custom', do not auto-calculate for that client.

---

### 5b. Client List Page — New Columns

File: `app/admin/clients/page.tsx` and the `ClientsTable` component

Add two new columns to the clients table:

**Package column:**
Show `package_tier` as a chip:
- starter → "Starter" (bg-slate-100 text-slate-700)
- growth → "Growth" (bg-blue-100 text-blue-700)
- pro → "Pro" (bg-purple-100 text-purple-700)
- custom → "Custom" (bg-amber-100 text-amber-700)
- null → "—"

**Services column:**
Show `services_active` as small text chips. Each service ID → a short display label:
- WEBSITE → "Web"
- GMB → "GMB"
- SEO → "SEO"
- GOOGLE_ADS → "G Ads"
- META_ADS → "Meta"
- WHATSAPP_MARKETING → "WA"
- AI_AUTOMATIONS → "AI"

If services_active is empty or null: show "—"

**Upsell badge:**
If `upsell_eligible = true`: show an orange badge "Upsell Ready" on the client row (beside the client name or as its own column).

**Filter additions:**
Add a "Package Tier" filter to the client list filters (above the table):
- All / Starter / Growth / Pro / Custom

Also add an "Upsell Eligible" filter toggle: shows only clients where upsell_eligible = true.

---

### 5c. Client Profile Page — Overview Tab

File: `app/admin/clients/[id]/page.tsx` and client profile client component

In the Overview tab header area, add:

**Active Services row:**
A row of coloured service chips showing each service in `services_active`. Same short labels as above (Web, GMB, SEO, etc.). If empty: "No services set."

**Package Tier badge:**
Show next to the client status badge. Same chip style as in the client list.

**Monthly Value:**
Show "₹X,XXX/month" from `clients.monthly_value` (if this column exists). If not: show total_monthly from the most recent confirmed agreement for this client.

---

### 5d. Upsell Eligible Toggle

In the Client Profile right sidebar or Overview tab, add a toggle:

**Label:** "Flag for Upsell Conversation"
**Current state:** shows current value of `upsell_eligible`

When Jabeer turns it ON:
- Show a confirmation dialog: "Mark [businessName] as upsell eligible? They will appear in the upsell dashboard."
- On confirm: UPDATE clients SET upsell_eligible = true WHERE id = client.id

When Jabeer turns it OFF:
- Update: upsell_eligible = false (no confirmation needed)

The orange "Upsell Ready" badge on the client list should appear/disappear based on this toggle.

---

### 5e. Renewals Page

File: `app/admin/clients/renewals/page.tsx`

This page already exists. Make one small addition:

For each client card on the renewals page, add a **Services** row showing the short service chips from `services_active`. This tells Jabeer which service is up for renewal.

No other changes to this page.

---

## 6. E4 — Monthly Invoice Reminder Banner

### Location
Admin dashboard (`app/admin/page.tsx`) — at the very top, above the KPI cards.

### Logic

```typescript
const today = new Date();
const dayOfMonth = today.getDate();
const showInvoiceReminder = dayOfMonth >= 1 && dayOfMonth <= 5;
```

If `showInvoiceReminder` is true:
1. Count of clients WHERE status = 'active'
2. Show a yellow alert banner at the top of the Admin dashboard:

```
[Yellow banner — bg-amber-50 border border-amber-200 rounded-xl p-4]
[Icon: FileText]
"Monthly invoices due. [X] active clients need invoices raised this month."
[Button: "Go to Finance →" — links to /admin/finance/invoices]
```

The banner is only shown between the 1st and 5th of the month. On other days, it is not rendered at all.

**Design:**
- bg-amber-50, border border-amber-200, rounded-xl, p-4
- Icon: `FileText` from lucide-react in text-amber-600
- Text: text-sm text-amber-800
- Button: text-sm font-medium text-amber-700 underline or styled as a small button

---

## 7. TypeScript Rules

- Run `npx tsc --noEmit` after all changes. Fix all errors before marking Phase E complete.
- `services_active` is a JSONB column — type it as `string[]` in the client type, or as `Json` from Supabase types and cast where needed.
- All chart props (Recharts) must be typed. If you get Recharts TypeScript errors, wrap the chart in a client component with `'use client'`.
- All new props must have explicit interfaces.

---

## 8. Completion Checklist

**SQL:**
- [ ] `revenue_type` column exists on invoices table (default 'mrr')
- [ ] `package_tier`, `services_active`, `upsell_eligible` columns exist on clients table

**E1 — Finance Split:**
- [ ] Finance dashboard shows 5 KPI cards: MRR / Setup Fees / One-Time / Total / Outstanding
- [ ] MRR Trend chart: Recharts line chart, last 6 months, only 'mrr' invoices
- [ ] Invoice creation form has Revenue Type selector (defaults to Monthly Retainer)
- [ ] Invoice list has Revenue Type filter (All / Monthly Retainer / Setup Fee / One-Time)
- [ ] P&L view shows three revenue lines (MRR / Setup Fees / One-Time) + total + expenses + net

**E2 — Revenue Forecast:**
- [ ] Forecast widget on Admin dashboard right column
- [ ] Current MRR progress bar (vs ₹50K target) — correct colour logic
- [ ] Pipeline forecast: count + total monthly from sent proposals
- [ ] Conservative estimate (30% close rate) shown with label
- [ ] Gap to target text (or target-hit message when ≥ ₹50K)

**E3 — Retainer Package System:**
- [ ] `calculatePackageTier()` function used when client created or services updated
- [ ] Client list: Package column with tier chip
- [ ] Client list: Services column with short service chips
- [ ] Client list: "Upsell Ready" badge on eligible clients
- [ ] Client list: Package Tier filter + Upsell Eligible toggle filter
- [ ] Client profile: Active Services chips in header
- [ ] Client profile: Package Tier badge
- [ ] Client profile: Monthly Value shown
- [ ] Client profile: Upsell eligible toggle with confirmation dialog
- [ ] Renewals page: services_active chips added to each client card

**E4 — Invoice Reminder:**
- [ ] Yellow banner shown on Admin dashboard between 1st–5th of month only
- [ ] Banner shows count of active clients
- [ ] Banner links to /admin/finance/invoices

**General:**
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] All pages load without runtime errors

**Once all items checked: Phase E is complete. All FMOS phases are done. Proceed to deployment.**
