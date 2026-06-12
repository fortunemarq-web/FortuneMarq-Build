# FortuneMarq Build — Quick Reference for Antigravity
**Always read this file first before starting any phase**

---

## App Context
- **App Name**: FortuneMarq Agency OS
- **Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase | Recharts | Framer Motion | @react-pdf/renderer
- **Current Version**: v4.6 — All Phases 1–6 Built + Security/Reliability Hardening (2026-06-11)
- **Design**: SaaS Light theme (Slate-50 bg, White cards, Slate-900 sidebar, #42CA80 green accent)

## What's Already Built — NEVER REBUILD THESE

All of the following exist and are functional:

| Route | Purpose |
|---|---|
| `/sales` | Sales cockpit — dialer, tags, follow-ups, scripts |
| `/admin` | Command hub — KPIs, priority list, pipeline snapshot |
| `/admin/build-tracker` | Build progress tracker (3 systems, 35+ modules) |
| `/admin/clients` | Client master list |
| `/admin/clients/[id]` | 6-tab client profile |
| `/admin/clients/renewals` | Renewal & upsell tracker |
| `/admin/finance` | Finance dashboard |
| `/admin/finance/invoices` | Invoice manager |
| `/admin/finance/expenses` | Expense log |
| `/admin/finance/pnl` | P&L statement |
| `/admin/growth` | Agency growth hub |
| `/admin/growth/instagram` | Instagram content tracker |
| `/admin/growth/linkedin` | LinkedIn content tracker |
| `/admin/growth/facebook` | Facebook content tracker |
| `/admin/growth/gmb` | GMB manager |
| `/admin/growth/seo` | SEO tracker |
| `/admin/growth/acquisition` | City acquisition overview |
| `/admin/growth/acquisition/[city]` | Per-city niche breakdown |
| `/admin/strategy` | Strategy-to-task AI engine |
| `/admin/strategy/archive` | Past strategy runs |
| `/admin/marketing` | Marketing module |
| `/admin/sales` | Sales analytics |
| `/admin/reports` | AI weekly report |
| `/admin/upload` | CSV uploader |
| `/admin/team` | Team management |
| `/admin/whatsapp-templates` | WhatsApp templates |
| `/admin/operations` | Operations hub |
| `/admin/alerts` | Alerts manager |
| `/manager/pipeline` | Niche kanban |
| `/manager/performance` | Telecaller stats |
| `/client/dashboard` | Client portal |
| `/lp/[niche]/[city]` | VSL landing pages |
| `/tasks` | Task board |
| `/projects` | Project management |

## Leads Table — Key Columns
```
company_name, phone, industry, city, status, lead_type
has_website (boolean), website_link, gmb_link
serp_ranked (boolean), serp_source (text)
tags (text[])
last_contacted_at, last_outcome, next_action_date, attempts, notes
```

## CSV Upload Columns Supported
```
Business Name | Phone | Has Website (Y/N) | Website Link | Google Maps Link
SERP_Ranked (Y/N) | SERP_Source | Niche | City
```

## Pending Tasks
- ⚠️ Run the four `20260611*` migrations in Supabase SQL editor, in order (RLS hardening → meeting columns → audit triggers → indexes) — app is hardened in code but DB policies apply only after these run
- At deploy: set `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` in Vercel
- Re-test proposal/agreement PDF download (blank-page fix shipped 2026-06-11 evening)
- UI pass remaining: outreach board, meetings, clients, finance; growth-page emoji icons → Lucide
- Latest session context for continuing work: `COWORK_HANDOFF.md`

## Non-Negotiable Rules
1. Authenticated Supabase client ALWAYS — never unauthenticated
2. RLS policy on EVERY new table (staff-only catch-all minimum; see `20260611000000_harden_rls_policies.sql` for patterns)
3. Mobile responsive — 44px touch targets minimum
4. Loading skeleton on every data-fetching component
5. Error boundary with retry on every page
6. Never break existing routes
7. Extend sidebar, don't restructure it
8. Server Actions for mutations, not API routes
9. Follow design tokens exactly — no custom colors outside the design system
10. No AI API calls in the sales cockpit — use local pitch-engine only
11. **Lead stage writes ONLY via `leadStageUpdate()` / `leadStatusUpdate()` from `lib/pipeline.ts`** — never set `outreach_stage` or `status` directly
12. **Every client-side mutation captures `{ error }`** and shows `toast.error()` from `components/ui/toast`; roll back optimistic state on failure
13. Cron routes: `verifyCronSecret(req)` first, then `createAdminClient()`. Service-role client ONLY for cron + public-by-design flows
14. **Green text/buttons use `brand-deep`** (tokens in `globals.css`); raw `#42CA80`/`brand` is for accents and fills only. No emoji in UI chrome (message content is fine)
15. **Shell pages use `min-h-full`, never `min-h-screen`** — `<main>` in `layout-wrapper.tsx` is the only scroll container. Only public no-sidebar routes (`/login`, `/lp`, `/client/report`, root) keep `min-h-screen`
16. Printable documents: wrap in `.print-area`, mark chrome `print:hidden`, add `<PrintButton />`. Never use the visibility-hidden print isolation trick (causes blank PDFs)
17. `leads` has NO `updated_at`/`assigned_to` — use `last_activity_at`, `assigned_sales_exec`, `meeting_booked_at` (auto-stamped by `pipeline.ts` helpers)

## DB Pattern — Every New Table Needs
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMPTZ DEFAULT NOW()
-- RLS enabled
-- Policy scoped to role
```

## Component Pattern — Every KPI Card
```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
     style={{ borderTop: '3px solid {color}' }}>
  <p className="text-sm text-slate-500 font-medium">{label}</p>
  <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{value}</p>
</div>
```
