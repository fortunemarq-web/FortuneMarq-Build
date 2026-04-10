# FMOS Phase E — Finance Split, Revenue Forecast, Retainer Package System
**Execute after Phase D.**
**Reference:** `FORTUNEMARQ_APP_CONTEXT.md`
**DB migrations:** `revenue_type` column on invoices + `package_tier`, `services_active`, `upsell_eligible` on clients (from MASTER_SPEC.md) must exist.

---

## Goal

Make the Finance module show MRR and one-time revenue separately so Jabeer can always see his true recurring revenue vs project revenue. Add the Revenue Forecast widget to the Admin dashboard. Tag clients with their service package so upsell opportunities are visible.

---

## E1 — Finance Module: MRR vs One-Time Revenue Split

### Current State
The Finance dashboard at `/admin/finance` shows revenue figures but doesn't distinguish between recurring monthly retainer revenue and one-time setup fees or project fees.

### Changes to Finance Dashboard (`/admin/finance`)

**Top KPI row — replace current revenue cards with:**

| Card | Definition | Data |
|---|---|---|
| MRR | Sum of invoices WHERE revenue_type = 'mrr' AND status = 'paid' AND month = current month | ₹X,XXX |
| Setup Fees This Month | Sum of invoices WHERE revenue_type = 'setup_fee' AND status = 'paid' AND month = current month | ₹X,XXX |
| One-Time Revenue | Sum of invoices WHERE revenue_type = 'one_time' AND status = 'paid' AND month = current month | ₹X,XXX |
| Total Revenue | MRR + Setup Fees + One-Time | ₹X,XXX |
| Outstanding | Sum of invoices WHERE status IN ('unpaid','overdue') | ₹X,XXX |

**MRR Trend Chart:**
Replace any existing revenue trend chart with a month-by-month MRR line chart (last 6 months). Only count `revenue_type = 'mrr'` invoices that are paid.

### Changes to Invoice Creation

When Jabeer creates a new invoice, the form must include a **Revenue Type** selector:
- Monthly Retainer (MRR) — for recurring monthly service fees
- Setup Fee — for one-time setup charges
- One-Time Project — for any one-off work

**Default:** Monthly Retainer (most common invoice type).

This value is saved to `invoices.revenue_type`.

### Invoice List Filters
Add a filter to the invoice list at `/admin/finance/invoices`:
- All Types
- Monthly Retainer
- Setup Fee
- One-Time

### P&L View Update (`/admin/finance/pnl`)
The P&L view should show three revenue lines:
- MRR: ₹X,XXX
- Setup Fees: ₹X,XXX
- One-Time: ₹X,XXX
- **Total Revenue: ₹X,XXX**
- Expenses: ₹X,XXX
- **Net: ₹X,XXX**

---

## E2 — Revenue Forecast Widget (Admin Dashboard)

### What It Is
A widget on the Admin morning dashboard (`/admin`) showing projected MRR for next month based on current pipeline. Jabeer sees at a glance whether the ₹50K MRR target is on track.

### Widget Location
Right column of the Admin dashboard, below the Pipeline Snapshot (built in Phase B).

### Widget Content

**Current MRR**
₹X,XXX / ₹50,000 target — progress bar (same as in Phase B but now sourced from real invoice data)

**Pipeline Forecast**
"If all proposals in pipeline convert:"
- Count of active proposals (`proposals` WHERE status = 'sent')
- Total monthly value of those proposals (sum of `total_monthly` from proposals table)
- Projected MRR if all convert: Current MRR + Total Monthly from proposals = ₹XX,XXX

Show this as: "₹X,XXX potential → ₹XX,XXX projected MRR"

**Close Rate Adjusted Forecast (simplified)**
For now: assume a 30% close rate on sent proposals (no historical data yet, so hardcode this as a default).
Adjusted: Current MRR + (Total pipeline monthly × 0.30) = ₹XX,XXX

Show as a secondary line: "Conservative estimate (30% close rate): ₹XX,XXX"

**Gap to Target**
"₹XX,XXX to go to hit ₹50K MRR"
If already above ₹50K: "Target hit! 🎯 Next milestone: ₹1L MRR"

**Note:** When historical data exists (after 2–3 months), the close rate can be calculated from actuals. For now 30% is hardcoded and labelled as "(estimated close rate)".

---

## E3 — Retainer Package System

### What It Is
A way to tag each client with what services they're on (their "package") so Jabeer can see at a glance what each client is paying for and what they could be upsold.

### DB Changes (already in MASTER_SPEC.md)
```sql
-- Already defined:
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_tier TEXT
  CHECK (package_tier IN ('starter','growth','pro','custom'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services_active JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_eligible BOOLEAN DEFAULT FALSE;
```

### package_tier Logic
| Tier | Definition |
|---|---|
| starter | Client on 1 service only (e.g., GMB only, or Website only) |
| growth | Client on 2–3 services |
| pro | Client on 4+ services |
| custom | Manually set — for special arrangements |

This is auto-calculated when a client's services are set. Jabeer can override to 'custom'.

### services_active
An array of service IDs the client is currently paying for. Example:
`["GMB", "SEO", "GOOGLE_ADS"]`

This is set when the client is created from an agreement (Phase D — the proposal's selected services become `services_active`).

### Where This Shows Up

**Client List (`/admin/clients`)**
- Add a "Package" column to the client table: shows `package_tier` as a chip (Starter / Growth / Pro / Custom)
- Add "Services" column: small icons or text chips for each active service (GMB, SEO, Ads, etc.)
- Add filter: Filter by package tier

**Client Profile (`/admin/clients/[id]`) — Overview tab**
- Show "Active Services" as a row of service chips in the header area
- Show "Package Tier" badge (Starter / Growth / Pro / Custom)
- Show "Monthly Value" (from `clients.monthly_value`)

**Upsell Eligible Flag**
- Logic: If `upsell_eligible = true`, show an orange "Upsell Opportunity" badge on the client card
- Jabeer manually sets `upsell_eligible = true` on a client when he thinks they're ready for an upsell conversation
- In Phase B, the Admin dashboard shows a count of upsell-eligible clients as a quick stat

**Setting upsell_eligible:**
On the Client Profile, in the right sidebar or Overview tab, a toggle: "Flag for Upsell Conversation". Toggling on sets `upsell_eligible = true`. A confirmation dialog: "Mark [Business Name] as upsell eligible? This will flag them on the dashboard."

**Renewal Alerts (existing `/admin/clients/renewals`)**
- Existing page already shows renewals countdown. No change needed here.
- Just ensure `services_active` is visible on the renewals page so Jabeer knows what service is up for renewal.

---

## E4 — Finance: Monthly Invoice Auto-Remind (Simple Version)

### What It Is
On the 1st of every month, FMOS should surface a reminder to Jabeer to raise monthly invoices for all active clients. This is NOT automated sending — just a dashboard alert.

### Implementation
On the Admin dashboard, if today's date is between the 1st and 5th of the month:
- Show a yellow alert banner at the top: "📋 Monthly invoices due. X active clients need invoices raised. [Go to Finance]"
- Count = clients WHERE status = 'active'

This is a simple date-based conditional render on the Admin dashboard. No cron job needed yet.

---

## Checklist for Antigravity

**Finance Split:**
- [ ] `revenue_type` column exists on invoices table
- [ ] Invoice creation form includes Revenue Type selector (defaults to Monthly Retainer)
- [ ] Finance dashboard KPI cards split into MRR / Setup Fees / One-Time / Total / Outstanding
- [ ] MRR Trend chart shows only 'mrr' type invoices, month-by-month, last 6 months
- [ ] Invoice list has Revenue Type filter
- [ ] P&L view shows three revenue lines + total + expenses + net

**Revenue Forecast:**
- [ ] Forecast widget on Admin dashboard right column
- [ ] Current MRR progress bar (vs ₹50K target) sourced from real invoice data
- [ ] Pipeline forecast shows sum of all sent proposals' monthly value
- [ ] Conservative estimate at 30% close rate shown with label
- [ ] Gap to target displayed
- [ ] Post-₹50K message shown when target is hit

**Retainer Package System:**
- [ ] `package_tier`, `services_active`, `upsell_eligible` columns exist on clients table
- [ ] `package_tier` auto-calculates from services count (1=starter, 2-3=growth, 4+=pro)
- [ ] `services_active` populated from proposal services when client created
- [ ] Client list shows Package and Services columns with filters
- [ ] Client profile shows active services chips + package tier badge
- [ ] Upsell eligible toggle on Client Profile
- [ ] Upsell badge visible on client cards when flagged
- [ ] Admin dashboard shows upsell-eligible count in daily stats

**Monthly Invoice Reminder:**
- [ ] Yellow banner on Admin dashboard between 1st–5th of month
- [ ] Count shows number of active clients
- [ ] Banner links to Finance → Invoices page
