# PHASE F — Inbound Engine + Performance Marketing OS
**Created:** 2026-06-12 | **Status:** PLAN — awaiting Jabeer's review
**Goal:** Every inbound lead from every channel lands in FMOS automatically with full source attribution; every rupee of ad spend is tracked to revenue; plan → strategize → execute → track → optimize → scale happens inside the app.

---

## What we already have (built/live today — don't rebuild)

| Asset | State |
|---|---|
| `ad_campaigns` table (platform, budget, spend, CPL, ROAS, external_campaign_id) | ✅ live in DB |
| `lead_source_attribution` table (utm_source/medium/campaign/content/term, ad_campaign_id, lead_id) | ✅ live in DB |
| `assignment_pools` + round-robin + **"Auto-Assign Inbound" automation rule** (assign → set status calling → notify owner → next action +10min) | ✅ seeded |
| **"Inbound SLA Check" automation rule** (lead_sla_missed → mark stale, notify admin, tag) | ✅ seeded |
| Notifications (bell + realtime + daily digest) | ✅ working |
| LP system `app/lp/[niche]` + `lead-capture-form` (public, service-role) | ✅ working |
| WhatsApp template system (niches × cities × outcomes) + `whatsapp_logs` | ✅ live |
| Duplicate detection/merge system | ✅ live |
| Bulk import tool (CSV) | ✅ working |
| Telecaller cockpit + outreach board + meetings → proposals → clients → invoices (revenue chain) | ✅ working |

**The inbound system is mostly a *connection + attribution + dashboard* job, not a ground-up build.**

---

## PART 1 — Inbound Capture Hub (all channels → one pipe)

### Architecture: one normalized ingestion path

```
Channel webhooks ──▶ /api/inbound/[channel]  (token-verified, service-role)
                          │
                          ▼
                 inbound_events (raw payload log — NEW table; replayable, debuggable)
                          │
                          ▼
                 normalize: phone → +91 E.164, name, niche/city guess
                          │
                          ▼
                 dedupe: match existing lead by phone → if found, log activity
                 + bump to follow-up queue instead of creating a duplicate
                          │
                          ▼
                 create lead (lead_type='inbound', source fields)
                 + lead_source_attribution row (utm/ad ids → ad_campaigns)
                          │
                          ▼
                 EXISTING automation: round-robin assign → notify telecaller
                 → SLA timer → appears in cockpit instantly
```

### Channels & how each connects

| # | Channel | How | Needs deploy? | Needs from Jabeer |
|---|---|---|---|---|
| 1 | **Website LPs** (`/lp/[niche]`) | Extend existing form: capture `utm_*`, `gclid`, `fbclid`, referrer from URL → attribution row | No — build now | Nothing |
| 2 | **Meta Lead Ads** (FB/IG instant forms) | Meta `leadgen` webhook → Graph API pulls the lead's answers → ingestion pipe | Yes (HTTPS URL) | Meta Business Manager admin access, create Meta App, Page subscription |
| 3 | **Click-to-WhatsApp ads (CTWA)** — *this is how "WhatsApp ads" get tracked* | WhatsApp Cloud API webhook: inbound messages carry a `referral` payload with the **ad id + headline** when the chat started from an ad → lead + attribution automatic | Yes | WABA decision (see ⚠️ below) |
| 4 | **WhatsApp organic inbound** | Same Cloud API webhook; messages logged to lead timeline (`whatsapp_logs`) | Yes | Same WABA |
| 5 | **Google Ads lead form assets** | Google Ads has a native webhook field — paste our URL + key, no API approval needed | Yes | Google Ads account access |
| 6 | **Google ads → LP traffic** | Covered by #1 via `gclid` + UTMs (always use templated UTMs) | No | Discipline: every ad uses the UTM builder |
| 7 | **Calls / GBP / walk-ins** | Cockpit quick-add gets a **Source picker** (call/GBP/referral/walk-in/other) | No — build now | Nothing |
| 8 | **IG / FB DMs** | Meta messaging webhooks → lead + conversation log | Yes | Phase 3 — after 2/3 are stable |

> ⚠️ **WABA decision (important):** a number connected to WhatsApp Cloud API can no longer be used in the regular WhatsApp/Business app. Options:
> **A.** Dedicated new number for ads + automation (team keeps current number for manual chats) — *recommended to start*.
> **B.** Migrate the main number to Cloud API and build all team chat through FMOS (bigger lift, Phase 3+).

### Speed-to-lead (the metric that makes inbound profitable)
- `leads.captured_at` (new) → first outreach_log delta = **response time**, shown per lead, per telecaller, per channel.
- SLA: inbound lead uncontacted after X minutes → already covered by the seeded SLA automation; we wire the cron to run it and set X (suggest 10 min).
- Optional auto-greeting: instant WhatsApp template to new inbound leads ("Got your enquiry — calling you in a few minutes") via Cloud API.

### Schema additions (small)
```sql
-- raw webhook log
create table inbound_events (id, channel, external_id, payload jsonb, status processed/failed/duplicate, lead_id, created_at);
-- lead source quick-filter columns
alter table leads add column lead_source text;        -- 'meta_lead_ad','ctwa','lp','google_lead_form','call','gbp','referral','dm','manual'
alter table leads add column captured_at timestamptz; -- inbound arrival time
alter table leads add column first_contact_at timestamptz; -- stamped by first outreach log
```

---

## PART 2 — Performance Marketing Tracking (spend ↔ leads ↔ revenue)

### Data model
- `ad_campaigns` (exists) = the campaign registry — every Meta/Google campaign mirrored here, manually at first, synced later. `external_campaign_id` is the join key.
- **NEW `ad_insights_daily`**: (date, campaign_id, platform, spend, impressions, clicks, leads, adset_name, ad_name) — daily grain so we get trends, not just MTD totals.
- Attribution chain already complete after Part 1:
  `spend (insights) → campaign → lead_source_attribution → lead → meeting → proposal → client → invoices (collected ₹)`

### Spend data in, per platform
| Platform | Now (week 1) | Later (automated) |
|---|---|---|
| Meta (FB/IG/CTWA) | CSV export → extended bulk-import maps to `ad_insights_daily` | **Meta Marketing API daily sync cron** (system-user token; same Meta App as webhooks) |
| Google Ads | CSV export → same importer | Google Ads API (developer token approval takes weeks — start application early, CSV until then) |

### Metrics computed (per campaign / platform / niche / city / creative)
- CPL, CPC, CTR, **cost per meeting, cost per proposal, CAC (cost per client won)**
- **ROAS**: collected invoice revenue from attributed clients ÷ spend (and projected ROAS using MRR × expected retention)
- Speed-to-lead and contact-rate per channel (are we wasting leads?)
- Lead quality per source: % reaching meeting_booked (uses existing pipeline stages — no new tracking needed)

---

## PART 3 — `/admin/marketing` Command Center (new hub page)

1. **Funnel board** — Spend → Impressions → Clicks → Leads → Contacted → Meetings → Proposals → Won, with conversion % and ₹-cost at every step. Filter: platform / campaign / niche / city / date range.
2. **Campaign Manager** — full CRUD (admin control): create campaign (platform, objective, niche, city, monthly budget, **CPL target**), pause/complete, notes. Every campaign links to its leads list.
3. **Channel scoreboard** — leads, CPL, contact %, meeting %, CAC, ROAS by channel side-by-side.
4. **UTM link builder** — pick campaign → generates the LP URL with correct UTMs (+ copy button). Kills attribution holes from hand-typed links.
5. **Speed-to-lead panel** — median response time per telecaller/channel; red list of uncontacted inbound leads.
6. **Optimize signals (auto-flags, surfaced as notifications + on the hub):**
   - 🔴 *Pause candidate*: CPL > target ×1.5 over last 5 days, or spend > ₹X with 0 leads
   - 🟢 *Scale candidate*: CPL < target ×0.7 with ≥N leads/week and contact-rate healthy
   - 🟡 *Fatigue*: CTR down >40% vs campaign's first-week average
   - ⚪ *Attribution leak*: >20% of inbound leads with unknown source
7. **Weekly Brief** (uses existing `marketing_weekly_briefs` table) — Monday auto-draft: last week's spend, CPL, winners/losers, flags raised, planned actions; admin edits + marks decisions → becomes the strategize/review ritual.

### The loop, mapped to features
| Stage | Where it lives |
|---|---|
| **Plan** | Campaign Manager: draft campaigns with budget, niche, city, offer, launch checklist |
| **Strategize** | Weekly Brief + niche kits (scripts/LPs per niche already exist) |
| **Execute** | Campaign goes active + UTM builder + lead forms/webhooks wired |
| **Track** | Funnel board + channel scoreboard + daily digest line ("yesterday: ₹X spend, Y leads, CPL ₹Z") |
| **Optimize** | Auto-flags → admin action (pause/edit) → logged to audit |
| **Scale** | Scale flags + budget recommendation (CPL headroom × capacity: telecaller call-load from attendance/work-hours data) |

---

## BUILD ORDER

### Stage 0 — now, no deploy needed (~1 session)
1. Schema: `inbound_events`, `ad_insights_daily`, leads source columns (run via SQL editor like today)
2. Ingestion endpoint `/api/inbound/[channel]` + normalization/dedupe/attribution pipeline (testable with simulated payloads)
3. LP form UTM/gclid/fbclid capture; cockpit quick-add Source picker
4. `/admin/marketing` hub: Campaign CRUD, funnel from existing pipeline data, channel scoreboard, UTM builder
5. Spend CSV importer (Meta + Google formats)
6. Daily digest gains marketing line

### Stage 1 — needs deploy + Meta assets (~1 session after Vercel is live)
7. WhatsApp Cloud API webhook (inbound messages + CTWA referral attribution + auto-greeting)
8. Meta Lead Ads webhook (leadgen subscription + Graph API pull)
9. SLA cron wiring → speed-to-lead live

### Stage 2 (~1 session)
10. Meta Insights daily sync cron (kills CSV import for Meta)
11. Google Ads lead-form webhook; Google Ads API application submitted
12. Optimize signals + Weekly Brief auto-draft

### Stage 3 (later)
13. IG/FB DM capture, call tracking/IVR, creative-level analytics, budget reallocation suggestions

### What Jabeer must provide (can be gathered in parallel, none blocks Stage 0)
- [ ] Meta Business Manager admin access + create a Meta App (I'll guide step-by-step)
- [ ] **WABA decision**: dedicated number for Cloud API (Option A) or migrate main number (Option B)?
- [ ] Google Ads account ID + manager access
- [ ] CPL targets per niche (even rough: e.g. dental ₹300, real estate ₹150…) — powers all optimize flags
- [ ] Commitment: every ad link goes through the UTM builder
