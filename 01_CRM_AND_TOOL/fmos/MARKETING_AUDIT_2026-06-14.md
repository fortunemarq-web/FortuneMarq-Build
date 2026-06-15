# Marketing Modules — Deep Audit
**Date:** 2026-06-14 · **Scope:** `/admin/strategy`, `/admin/growth`, `/admin/marketing`
**Method:** Read every page, tab, action file, and data hook. Verified each number's source.

---

## THE THREE MODULES & HOW THEY CONNECT

| Module | Role in loop | Verdict |
|---|---|---|
| `/admin/strategy` — Strategy Engine | **PLAN** (AI: goal → tasks) | ✅ Real & working |
| `/admin/growth` — Agency Growth | **EXECUTE/MANAGE** (do the work) | 🟡 Mostly real, 1 fake chart |
| `/admin/marketing` — Agency Marketing | **TRACK/OPTIMISE** (see results) | 🟡 1 great tab, 2 tabs full of fake demo data |

Intended loop: **Strategy → Growth (organic) / Inbound (paid) → Marketing analytics → adjust.**
The plumbing is real; the dashboards that *display* results are where the fake data hides.

---

## 1. STRATEGY ENGINE (`/admin/strategy`) — ✅ FULLY REAL

**What works (verified):**
- `extractStrategyTasks()` makes a **real Anthropic API call** (`claude-sonnet-4-6`) to turn a pasted strategy into structured tasks. `app/admin/strategy/actions.ts:58`
- `saveApprovedTasks()` writes to `strategy_runs` + `tasks` + `strategy_run_tasks` (linking) — real, transactional-ish. `actions.ts:107`
- Destinations are real: organic channels (IG/LinkedIn/FB/GMB/SEO) + every acquisition city/niche pulled live from `acquisition_targets`. `app/admin/strategy/page.tsx:15`
- Archive + per-run completion counts are real (`fetchStrategyRunCompletion`). `actions.ts:193`

**Gaps / nits:**
- Timeframe dropdown has a "Custom" option (`page.client.tsx:98`) but no custom date picker — selecting it does nothing special.
- Tasks route to a `section_tag`/destination string, but there's **no back-link from a published content piece or a closed lead to the strategy run that generated it** — so "did this strategy work?" can't be answered automatically. Completion = task ticked, not outcome achieved.

**Bottom line:** This is the strongest of the three. Genuine AI planning → real tasks. No fake data.

---

## 2. AGENCY GROWTH (`/admin/growth`) — 🟡 MOSTLY REAL

### ✅ Real (verified)
- Header stats (Posts Published MTD, per-channel) — computed live from `content_pieces`. `app/admin/growth/page.tsx:46`
- Platform follower/view counts — **honestly** show `"— (not connected)"`, not fabricated. `page.tsx:77` ✓ good
- Pending Tasks checklist — real DB writes (fixed in the 2026-06-14 bug sweep). `GrowthTaskChecklist.tsx`
- **Client Acquisition tab** — both tables real:
  - `CityOverviewTable` — real per-city lead counts, pipeline, meetings MTD, won MTD from `leads`. `CityOverviewTable.tsx:15`
  - `ActiveCampaignsTable` — real from `ad_campaigns`. `ActiveCampaignsTable.tsx:7`
- All of `app/admin/growth/actions.ts` is real DB: content CRUD, acquisition targets, SEO pages/keywords/backlinks, GMB checklist, **GMB metrics (manual monthly entry — honest)**, review requests.

### ❌ Fake / placeholder
- **`OrganicTrendChart` — HARDCODED FAKE.** `MOCK_DATA` with invented W1–W8 numbers for Instagram (1100→1245), Website (3800→4210), GMB (11000→12450). Sits at the **top of the Organic Presence tab** — the most prominent chart on the page. `OrganicTrendChart.tsx:14`. This is the single most misleading element in the Growth module.

### Missing
- Per-channel publishing works, but **engagement/reach numbers depend on social-platform APIs** that aren't connected. Currently `content_pieces` has reach/likes/etc. columns that must be **typed in manually** (`upsertContentPiece` accepts them) — fine for now, but no auto-sync.

---

## 3. AGENCY MARKETING (`/admin/marketing`) — 🟡 ONE GREAT TAB, TWO FULL OF DEMO DATA

### ✅ Inbound & Funnel tab — FULLY REAL & EXCELLENT
The best-built screen in the whole marketing suite. `tabs/inbound-funnel-tab.tsx`
- Real funnel (Leads→Contacted→Meetings→Proposals→Won) from `leads`.
- Real KPIs: Ad Spend, CPL, Cost/Meeting, CAC, **Speed-to-Lead (median response time)**.
- Real channel scoreboard, real `inbound_events` log.
- **Working CSV ad-spend import** (auto-detects Meta vs Google export format). `inbound-funnel-tab.tsx:63`
- **Working UTM link builder** tied to live niches + campaigns.
- All empty states are honest ("No inbound leads yet").

### 🟡 Overview tab — MIXED (real KPIs, fake everything else)
`tabs/overview-tab.tsx`
- ✅ Real: Total Leads (MTD), Avg CPL, Total Spend — via `useMarketingOverviewStats` (real queries). Weekly Brief — real from `marketing_weekly_briefs`.
- ❌ **`performanceData`** (Leads Performance area chart, Mon–Sun = 4,7,5,12,8,15,11) — HARDCODED. `overview-tab.tsx:37`
- ❌ **`sourceData`** (Lead Sources pie: Organic 35% / Meta 45% / LinkedIn 20%) — HARDCODED. `overview-tab.tsx:47`
- ❌ "Top Channel: Meta Ads (Instagram)" + "Conversion Rate: 4.2%" — HARDCODED. `overview-tab.tsx:333`
- ❌ Quick Actions ("4 focus keywords dropped", "Meta Ads 90% of budget", "2 case studies ready") — HARDCODED static text, buttons do nothing. `overview-tab.tsx:376`
- ⚠️ ROI KPI hardcoded "0x"; `leads_delta_pct` hardcoded 0 ("Mock for now", `use-marketing-data.ts:254`); content target hardcoded 8.
- ⚠️ "Generate New Brief" button only **refetches** the latest brief — it does NOT call AI to generate a new one. (Brief creation must happen elsewhere/cron.)

### 🟡 Paid Campaigns tab — MOSTLY REAL, two fake widgets
`tabs/paid-campaigns-tab.tsx`
- ✅ Real: platform pacing cards, campaign table, add-campaign modal, inline spend edit — all from `ad_campaigns`.
- ❌ **`cplTrendData`** (CPL Trend chart, W1–W8 per platform) — HARDCODED. `paid-campaigns-tab.tsx:123`
- ❌ **"Top Creative" card** (entirely invented: "3 Restaurant Clients Scaled to ₹1L/month", 3.8% CTR, 42K impr, 16 leads, play button) — HARDCODED. `paid-campaigns-tab.tsx:514`
- ⚠️ Platform card "Status: HEALTHY" + "Active" badge are hardcoded labels, not derived.

### ✅ Organic & SEO tab — honest placeholder
Shows "GSC not connected" (cleaned in the 2026-06-14 bug sweep). No fake data. ✓

### 🟡 Content Calendar tab — REAL, one nit
`tabs/content-calendar-tab.tsx` — real `content_pieces`, kanban + calendar, add-content modal all work.
- ⚠️ Calendar opens on a **hardcoded month** `new Date(2026, 2, 1)` (March 2026) instead of the current month. `content-calendar-tab.tsx:31`

---

## CONSOLIDATED FINDINGS

### A. Fake/demo data — ✅ ALL FIXED (M1 honesty pass, 2026-06-14)
1. ✅ `OrganicTrendChart` — now a server component pulling real `gmb_snapshots` + `organic_traffic_snapshots`; honest "no data yet" state until populated. (+ new `OrganicTrendChartClient.tsx`)
2. ✅ Overview `performanceData` — now real daily lead counts via new `useLeadsByDay(7)` hook.
3. ✅ Overview `sourceData` pie — now real `leads.source` breakdown via new `useLeadSourceBreakdown()` hook; honest empty state.
4. ✅ Overview "Top Channel / conversion" — derived from real source breakdown + real won/leads conversion rate (shows "—" when no data).
5. ✅ Overview Quick Actions — replaced 3 fake alerts with real working navigation links (SEO / Paid / Content).
6. ✅ Paid `cplTrendData` — now real weekly CPL per platform from `ad_insights_daily` via new `useCplTrend(8)` hook; honest empty state.
7. ✅ Paid "Top Creative" card — replaced invented case study with honest "creative data not connected" placeholder.
8. ✅ Content Calendar — opens on the current month (was hardcoded March 2026).
9. ✅ Overview ROI "0x" → replaced with real "Conversion Rate" KPI; `leads_delta_pct` now computed vs last month (real).

**Verified:** `npx tsc --noEmit` → 0 errors after all changes.

### B. Conceptual fragmentation (no code bug, but causes the confusion you feel)
- Three modules with overlapping vocabulary ("organic", "campaigns" appear in two places each).
- No single view that shows **Strategy → work done → result achieved** as one thread.
- Strategy completion = "task ticked," not "outcome measured." The loop doesn't close on results.

### C. External-API-dependent (honest placeholders today; real later)
- Social follower/reach/engagement (needs Meta/IG/LinkedIn APIs) — manual entry for now.
- Organic traffic + keyword rank (needs Google Search Console + Analytics) — placeholder.
- Live ad spend (needs Meta/Google Ads APIs) — **CSV import works today** as the bridge.

---

## RECOMMENDED FIX ORDER (when we move on this)

**Phase 2-M1 — Honesty pass (fast, high trust impact):** Replace all 9 items in Finding A with either real queries (where data exists) or honest "not connected / no data yet" states — exactly like the SEO tab was handled. Most can be wired to data that already exists (e.g. `performanceData` → real daily lead counts; `sourceData` → real `leads.source` breakdown; `cplTrendData` → real `ad_insights_daily`).

**Phase 2-M2 — Close the loop:**
- ✅ DONE (2026-06-14): Strategy runs now measure real outcomes. New `fetchStrategyRunOutcome()` in `app/admin/strategy/actions.ts` maps each run's destination + timeframe to actual results (organic → content pieces published on that channel; acquisition → leads/meetings/clients-won in that city). Surfaced as an "Outcome" column in `/admin/strategy/archive` — the archive is now the **plan → work → result** view, with a "live" tag while a timeframe is still running.
- ✅ DONE (2026-06-14): Unified **Marketing Hub** built at `/admin/marketing-hub` (new sidebar entry, first in Insights group). One front door that shows real MTD KPIs (leads, clients won, content published, ad spend), the 3-stage loop (Plan→Strategy / Execute→Growth / Track→Marketing) with live counts, recent strategies threaded to their measured outcomes, and quick links to every sub-area. Also tightened sidebar `isActiveLink` to match path boundaries (so "Marketing" no longer falsely highlights on the hub).

**Phase 2-M3 — Connect external APIs (post-launch):** GSC for organic, Meta/Google Ads for live spend, social APIs for reach. Removes the last manual-entry placeholders.

**Note:** None of Finding A blocks daily use — the *real* tabs (Inbound Funnel, Content Calendar, Acquisition tables, Strategy Engine) are fully functional today. The fake widgets are display-only and isolated; fixing them is low-risk.
