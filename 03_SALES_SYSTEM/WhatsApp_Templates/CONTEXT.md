# 03 — WhatsApp Templates
**Last Updated:** April 2026 | **Status:** COMPLETE — 17 templates in 5 JSON files in FMOS_Template_Data/

## Purpose
All WhatsApp message templates used throughout the sales flow. Templates are pre-written and loaded by FMOS. Jabeer sends some manually. Others are triggered automatically by Afifa's outcome logging or by bot response.

## Who Sends What
| Category | Sent By | Trigger |
|---|---|---|
| Curiosity (4) | Jabeer — manual batch send | Before calls begin, per lead type |
| Bot Reply (4) | Bot — auto-send | Lead replies to curiosity message |
| Outcome Triggered (6) | FMOS auto-send | Afifa logs call outcome |
| Follow-Back Reminder (1) | Afifa — FMOS button | Day of the follow-back appointment |
| Post Meeting (4) | Jabeer — manual | After meeting / proposal / agreement stage |

**Total: 17 templates** (not 28 — that was the old plan before architecture was finalised)

## Template Files for Code
Location: `WhatsApp_Templates/FMOS_Template_Data/`
- `curiosity_templates.json` — 4 templates (Type A/B/C/D) — Jabeer manual batch, need Meta approval
- `bot_reply_templates.json` — 4 templates — bot auto-sends when lead replies (session window, no Meta approval needed)
- `outcome_templates.json` — 6 templates — FMOS auto-sends on outcome log (need Meta approval)
- `followback_reminder_templates.json` — 1 template — Afifa FMOS button on follow-back day
- `post_meeting_templates.json` — 4 templates (Proposal Sent / Proposal Follow-up / Agreement Request / Invoice Sent) — Jabeer manual
- `whatsapp.types.ts` — TypeScript interfaces for template structure
- `index.ts` — Template loader utility

## Template Architecture
- Curiosity templates: 1 per lead type (A/B/C/D). Frame around market research data. Goal: get a reply. Sent before calls begin.
- Bot reply templates: Sent when lead replies to curiosity. Sends **niche+city landing page link** (not PDF — portfolio/case study page for that niche). Goal: get them to check out FortuneMarq.
- Outcome triggered: Auto-sent the moment Afifa logs a call outcome in FMOS. One per outcome type.
- Follow-back reminder: Single message. Afifa hits a button in FMOS on the day of follow-back. Reminds lead of agreed callback time.
- Post meeting: Jabeer sends manually. 4 stages: Proposal sent, Proposal follow-up (day 2), Agreement request, Invoice sent.

## Key Decisions (locked)
- Bot reply sends **landing page link** (not PDF report again) — avoids duplicate and drives them to explore the portfolio
- Tone: Friendly and conversational throughout
- FortuneMarq is branded as "FortuneMarq" only (not "FortuneMarq Media & Marketing" in message body — too long)
- Meta WhatsApp Business API must be purchased and connected to FMOS before templates go live
- Landing pages per niche must be live before bot replies can be sent

## Meta Approval Notes
- Business-initiated messages (curiosity, outcome, post meeting) need Meta template approval before sending
- Use `{{1}}`, `{{2}}` variable format for Meta templates
- Session-window messages (bot replies within 24h of user reply) do NOT need Meta approval

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Old plan: 28 templates across 6 categories. Waiting on L2 scripts. |
| 2026-04-01 | Full redesign. 17 templates in 5 categories. Architecture decided: Jabeer sends curiosity manually, bot auto-sends when lead replies, FMOS auto-sends on outcome log, Afifa uses FMOS button for follow-back reminder, Jabeer handles post-meeting manually. Bot reply changed from PDF to niche landing page link. TypeScript types + loader created in FMOS_Template_Data/. Needs Meta API setup + niche landing pages before going live. |

---

## FortuneMarq System DNA
> This section is present in every context file. It ensures every Claude session — regardless of folder — understands the full interconnected system.

### Business
- **Legal Name:** FortuneMarq Media & Marketing
- **Brand:** FortuneMarq | **Tagline:** Marketing That Pays You Back
- **Address:** Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020
- **CRM/OS:** fmos.fortunemarq.com | **Website:** fortunemarq.com
- **Contact:** fortunemarq@gmail.com | +91 93530 82656

### Team
| Person | Role | Status |
|---|---|---|
| Jabeer | Founder — strategy, sales, closing, all tech | Active |
| Afifa | Telecaller — calls, outcomes, PDF delivery, meeting booking | Hired, not started |
| Zaid | Website builder — Antigravity builds, task execution | Training |
| Sufiyan | Website builder — Antigravity builds, task execution | Training |

### The Full System Map
```
07_DATA_AND_RESEARCH
  → feeds → 06_PAID_MARKETING + 03_SALES_SYSTEM
06_PAID_MARKETING
  → feeds → 01_CRM_AND_TOOL (inbound leads)
03_SALES_SYSTEM
  → feeds → 01_CRM_AND_TOOL (pipeline) + 04_CLIENT_MANAGEMENT
01_CRM_AND_TOOL (FMOS — central nervous system)
  → feeds → 02_SERVICE_DELIVERY_AUTOMATION + 04_CLIENT_MANAGEMENT + 08_FINANCE
02_SERVICE_DELIVERY_AUTOMATION
  → feeds → 04_CLIENT_MANAGEMENT (delivery) + 08_FINANCE (invoicing triggers)
04_CLIENT_MANAGEMENT
  → feeds → 08_FINANCE (renewals) + 03_SALES_SYSTEM (upsells back to pipeline)
05_FORTUNEMARQ_ONLINE_PRESENCE
  → feeds → 06_PAID_MARKETING (brand trust) + 03_SALES_SYSTEM (inbound leads)
08_FINANCE ← receives from all service delivery and client management
09_LEGAL_AND_OPERATIONS ← supports 03_SALES_SYSTEM + 04_CLIENT_MANAGEMENT
10_PERSONAL_GROWTH ← supports Jabeer across all folders
```

### Master Flow
```
Data (L0) → Campaign → Lead in FMOS → 3-Touch Outreach → Meeting
→ Proposal → Agreement → Invoice → Onboarding → Delivery
→ Monthly Report → Health Score → Upsell → Renewal
```

### Content Build Hierarchy (current progress)
- L0 Niche Data Reference Sheet — COMPLETE
- L1 Lead CSV Files + PDF Index — COMPLETE
- L2 Telecaller Scripts — COMPLETE — 4 lead-type JSON files in FMOS_Script_Data/
- L3 WhatsApp Templates — COMPLETE — 17 templates in 5 JSON files in FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic PDF, JSON schema in FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — 1-page doc, service terms, payment policy
- L5 SOPs + Onboarding — COMPLETE — onboarding_checklists.json + onboarding_sop.md
- L6 Report Templates + Health Score — PENDING
- L7 Upsell System — PENDING

### Tech Stack
- CRM: Next.js 16, TypeScript, Tailwind CSS v4, Supabase
- Hosting: Hostinger → fmos.fortunemarq.com
- Builds: Antigravity | AI: Claude Pro + Claude Code
- Design: Canva

### Revenue Targets
- ₹50K MRR → End April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → Hiring trigger
- ₹5L MRR → 2-year vision

### Niche Attack Order (Phase 1 — Hubli-Dharwad)
1. Gyms (63,950/mo) 2. Skin Clinics (41,850/mo) 3. Computer Training (24,350/mo)
4. Dental (21,100/mo) 5. Car Rentals (16,450/mo) 6. JEE/NEET Coaching (12,300/mo)

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
