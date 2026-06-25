# FortuneMarq — Offline Operating Structure

**Created:** 2026-06-16
**Purpose:** Map of everything that lives **outside FMOS** — the planning, creation, knowledge, and archive layer you work in (often via Cowork). FMOS holds *live operational data*; these folders hold *the thinking, the source content, and the records*.

---

## The split — what lives where

| In FMOS (the app) | In these folders (offline) |
|---|---|
| Live leads, statuses, pipeline | Lead source data, scrapes, cleaning |
| Campaign records + metrics | Campaign plans, strategy, creative briefs |
| Client records, tasks, invoices | Per-client plans, details PDFs, deliverable archives |
| Bot conversations | Bot knowledge base (its source of truth) |
| Dashboards | Design docs, roadmap, SOPs |

**Rule of thumb:** if it's a *decision, a draft, a source file, or a record*, it lives offline. If it's *live and operational*, it lives in FMOS. The offline plan is created here → pushed into FMOS → results snapshot back here.

---

## Folder map (build on the existing numbered structure)

```
FortuneMarq_Build/
├── 00_MASTER/                      ← brain of the whole operation
│   ├── FMOS_System_Design_And_Tasks.md     (the full design)
│   ├── FMOS_Execution_Roadmap.md           (build order → launch gate)
│   ├── Offline_Operating_Structure.md      (this file)
│   ├── MASTER_CONTEXT.md / Vision / CRITICAL_PATH …
│   ├── Brand_Assets/                        (logos, fonts, guidelines)
│   └── Bot_Knowledge_Base/         ← NEW: the bot's source of truth
│
├── 01_CRM_AND_TOOL/                ← the FMOS app codebase (the spine)
├── 02_SERVICE_DELIVERY_AUTOMATION/ ← delivery automation (ads/SEO/web)
│
├── 03_SALES_SYSTEM/                ← scripts, WhatsApp templates, proposals, agreements
├── 04_CLIENT_MANAGEMENT/
│   ├── Onboarding / Monthly_Reports / Upsell_System  (process content)
│   └── Clients/                    ← NEW: one folder per signed client
│       └── _TEMPLATE/
│
├── 05_FORTUNEMARQ_ONLINE_PRESENCE/ ← own website, GMB, SEO, social content
│   ├── niches/ (LP source)  Instagram_Facebook/  LinkedIn/  SEO_and_Local_SEO/
│   └── Proof_Vault/                ← NEW: real client results + case studies
│
├── 06_PAID_MARKETING/
│   └── Campaigns/<City>/<Niche>/   (plan, strategy, creative brief, results) ✅ built
│
├── 07_DATA_AND_RESEARCH/           ← leads, keywords, competitor/SERP, PDFs
├── 08_FINANCE/                     ← pricing (locked), invoicing, revenue
├── 09_LEGAL_AND_OPERATIONS/        ← agreements, legal, SOPs
└── 10_PERSONAL_GROWTH/
```

---

## New homes added (the gaps)

**`00_MASTER/Bot_Knowledge_Base/`** — the single source of truth the AI bot answers from (web + WhatsApp + social). Files: services, pricing, FAQs, objections, guardrails & escalation. Edited here → loaded into the bot (6.1).

**`04_CLIENT_MANAGEMENT/Clients/<ClientName>/`** — one folder per signed client. Copy `_TEMPLATE/` per client:
- `01_onboarding_details.md` — info + assets collected (the "download details PDF" source)
- `02_delivery_plan.md` — milestones + tasks planned in Cowork → pasted into FMOS
- `03_results.md` — outcomes/metrics archive (feeds reports + Proof_Vault)
- `monthly_reports/` · `assets/` (links to Drive)

**`05_FORTUNEMARQ_ONLINE_PRESENCE/`** — real, consented client results + case studies live in its **Proof_Vault** subfolder (auto-created by FMOS's "Mark as Case Study" consent flow on first use). Feeds the on-request proof link (2.2) and proposals. Real data only — never fabricated.

---

## Conventions
- **Per-campaign** = `06_PAID_MARKETING/Campaigns/<City>/<Niche>/` (copy `_TEMPLATE/`).
- **Per-client** = `04_CLIENT_MANAGEMENT/Clients/<ClientName>/` (copy `_TEMPLATE/`).
- **Cities use real names**, niches use `Underscore_Case`.
- Heavy media (videos, raw footage) → **Google Drive**, linked from the relevant folder — never stored in-repo or in FMOS.
- Anything client-facing and "live" belongs in FMOS, not here.
