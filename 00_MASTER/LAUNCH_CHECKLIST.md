# FortuneMarq — Launch Checklist (Outside-FMOS Owner Tasks)

**Created:** 2026-06-25 · **Owner:** Jabeer
**Scope:** The manual / platform / account tasks **Jabeer does outside the FMOS codebase** to go live. Code/build tasks live in `FMOS_Execution_Roadmap.md`. Compiled from CRITICAL_PATH, PENDING_ACTIONS, the roadmap, the design doc, and the `05`/`06`/`08` folders.

> **Division of labour:** Jabeer does the platform/account/content/data work below. Claude (in FMOS) does the code + the Vercel/env wiring + the in-app confirmation. Where a task is shared, it's noted.

---

## ✅ Already handled — do NOT redo
- Meta **Business Manager** created + business verification approved (BM `879084085296794`)
- **WhatsApp**: number `+91 79759 18980` registered, API token live, **all 33 templates Meta-approved**, webhook set
- **Google Calendar + Meet** API connected (2026-06-25 — published OAuth app so the token won't expire)
- **Meta Pixel** live + firing on site + 117 LPs (2026-06-25, ID `1713470496330818`)
- **Google Search Console** verified + sitemap (126 URLs incl. 117 LPs) submitted
- **GA4 + Microsoft Clarity** live
- Pricing / packages locked (`08_FINANCE/Pricing_Decisions`)
- Campaign Drive folder structure (`06_PAID_MARKETING/Campaigns/<City>/<Niche>/`)
- Bot knowledge base + review/referral automation built
- 117 niche LPs verified live on the canonical domain (`fortunemarq.com/lp/...`)
- `ad-conversions` + `reactivation` + `review-requests` crons built & scheduled (dormant until switched on)

---

## 1️⃣ Accounts to create — `06_PAID_MARKETING`
- [ ] **Create Google Ads account** (the big missing one)
- [ ] **Verify the Meta Ads account** under the BM + add an India payment method
- [ ] **Request the Google Ads developer token** — ⏰ *start now; Google approval takes days* (needed later for offline conversion import)
- [ ] Create **Instagram + Facebook Business** accounts (+ link the FB Page to the BM)
- [ ] Create **LinkedIn company page** + optimise Jabeer's personal profile

## 2️⃣ Paid ads / inorganic — `06_PAID_MARKETING`
- [ ] Build campaign strategy per niche×city in Cowork — **start: Dental + Skin Clinics, Hubli**
- [ ] Set the budget per campaign (decided live in Cowork)
- [ ] Plan the niche launch order (rank by search volume + directory-leakage from `market_insights`)
- [ ] Film ad creative (Jabeer on camera) → upload to Drive → freelancer edits → Jabeer approves
- [ ] **Launch-day conversion wiring** *(Jabeer = platform side · Claude = FMOS/env side)*:
  - **Meta:** Events Manager → Pixel → Conversions API → **generate token** → Claude sets `META_CAPI_TOKEN` in Vercel · connect Pixel to the ad account · set **"Lead"** as the optimisation conversion
  - **Google:** link **GA4 → Google Ads** · mark **`generate_lead`** a conversion (no-code, works immediately) · later (after dev-token approval) create "Meeting" + "Won" conversion actions → Claude sets `GOOGLE_ADS_*` env

## 3️⃣ Organic presence — `05_FORTUNEMARQ_ONLINE_PRESENCE`
**GMB (Google Business Profile):**
- [ ] Add all 7 services + descriptions
- [ ] Upload 15+ photos (office, team, work samples)
- [ ] Write a keyword-rich description ("digital marketing agency Hubli")
- [ ] Set a 2×/week posting schedule
- [ ] Pre-populate Q&A with 5 common questions
- [ ] Request reviews from existing freelance clients (Kannada reviews fine)

**SEO:**
- [ ] Keyword targeting plan (Cowork) — agency + niche searches, Hubli/Dharwad
- [ ] On-page SEO + blog content repurposed from the niche-data PDFs

**Social:**
- [ ] Instagram + Facebook: **5 posts/week** (strategy is done — just execute: 2× niche-data reels, behind-the-system, AI-tools education, client results, agency tips)
- [ ] LinkedIn: B2B content + connection outreach to Hubli/Dharwad owners

## 4️⃣ Finance & data — `08_FINANCE` (entered in FMOS, but Jabeer's data)
- [ ] Activate GST invoice settings — GSTIN `29ICWPS9816Q1ZS` + Karnataka Bank A/C `0332202500001101`, IFSC `KARB0000332` (18% GST). Test an invoice PDF.
- [ ] Enter real test clients (Austin Dental Spa, OM SAI TRAVELS)
- [ ] Collect client results + Google reviews (with written consent) for the proof vault (`05/Proof_Vault`)

## 5️⃣ Team
- [ ] Finalise Afifa's start date
- [ ] Train Afifa on FMOS (telecaller view, 9 outcomes, WhatsApp send, follow-back, booking, A/B/C/D scripts)
- [ ] Queue her first call batch — **Dental + Skin Clinics, Hubli**
- [ ] Establish the Cowork planning cadence (campaigns, content, SEO, social, optimisation)

## 🚦 The launch switches — flip together at the Launch Gate *(Jabeer decides · Claude sets in Vercel + confirms)*
- [ ] `WHATSAPP_LAUNCH=1` — **starts real customer messaging** (until this, FMOS only messages the QA test numbers)
- [ ] `REACTIVATION_ENABLED=1` — starts the cold-lead revival drip
- [ ] `META_CAPI_TOKEN` + `GOOGLE_ADS_*` (from §2) — turns ad spend into measurable, self-optimising campaigns

---

## Folder map (where the work + assets live)
| Folder | What |
|---|---|
| `00_MASTER` | Plans, roadmap, this checklist |
| `01_CRM_AND_TOOL/fmos` | The FMOS app (code — Claude's domain) |
| `03_SALES_SYSTEM` | Scripts, WhatsApp templates, proposals (live in FMOS) |
| `05_FORTUNEMARQ_ONLINE_PRESENCE` | Website, GMB, SEO, social, LP content |
| `06_PAID_MARKETING` | Meta + Google ad campaigns, creatives, budgets, results logs |
| `07_DATA_AND_RESEARCH` | Leads, keyword/competitor data, report PDFs |
| `08_FINANCE` | Invoicing, GST, pricing |
| `09_LEGAL_AND_OPERATIONS` | Registration, agreements, terms (done) |
