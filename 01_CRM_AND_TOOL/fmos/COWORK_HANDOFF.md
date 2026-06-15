# FMOS — Master Handoff Document
**Last updated:** 2026-06-14 · **Author:** Jabeer + Claude (Sonnet 4.6)
**Read this fully before touching any code. This is the single source of truth.**

---

## 0. Machine & Repo Setup (READ FIRST)

**Active dev machine: Windows 11** (`C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos`)
- `.env.local` IS on this machine — all 10 real API keys present
- Dev server: `npm run dev` → http://localhost:3000 (already installed, `node_modules` present)
- Node v24.11.1 · npm 11.4.1
- Git remote: github.com/sayedjabeer/FortuneMarq-Build · branch: `master`
- Supabase project: `cnwooodktqwvpzkucskm` (all 38 tables live, RLS hardened)

**To start a new dev session:**
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
npm run dev
```

**To run SQL on Supabase** (no psql on this machine):
→ supabase.com/dashboard/project/cnwooodktqwvpzkucskm/sql/new → paste → Run

---

## 1. What FMOS Is

FortuneMarq Marketing Operating System — a custom CRM for Jabeer's digital marketing agency.
Full lifecycle: Lead calling → Outreach → Meeting → Proposal → Agreement → Client → Invoice → Team

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Supabase · Recharts · Framer Motion · @react-pdf/renderer

**Supabase client rules (CRITICAL):**
- Server components / server actions → `createServerClientWithCookies()` from `@/lib/supabase-server`
- Client components → `createClient()` from `@/lib/supabase`
- Cron routes → `createAdminClient()` only

**Key conventions:**
- `outreach_stage` = single source of truth for lead position; ONLY write via `leadStageUpdate()` / `leadStatusUpdate()` in `lib/pipeline.ts`
- No emoji in UI chrome. No `alert()`/`confirm()`/`prompt()` — use `toast` + `promptModal()` only
- `brand-deep` (#1E7A4F) for text/buttons; `#42CA80` for accents/fills only
- Shell is `h-dvh`; `<main>` is the only scroll container. Pages use `min-h-full`
- Outcome IDs: `INTERESTED_BOOK` | `INTERESTED_FOLLOW_UP` | `INTERESTED_SEND_INFO` | `NOT_INTERESTED` | `FOLLOW_BACK` | `WRONG_NUMBER` | `NO_ANSWER` | `GATEKEEPER`

---

## 2. Build Phase Status

| Phase | Status | Summary |
|---|---|---|
| Phase 0: Foundation | ✅ DONE | DB schema (38 tables), RLS, audit triggers, types regenerated |
| Phase A–F: Features | ✅ DONE | All routes built, WhatsApp Cloud API live, inbound pipeline live |
| Phase 1: Bug Audit | ✅ DONE (2026-06-14) | All 17 critical bugs + 22 confirm() replacements fixed. TypeScript 0 errors. |
| **Phase 2: New Features** | 🔴 NEXT | Start with middleware.ts auth gate (P0), then outbound WhatsApp UI, proposal PDF |
| Phase 3: Live Testing | ⏳ PENDING | Runtime smoke test all flows with real API keys |
| Phase 4: Security Audit | ⏳ PENDING | Auth middleware, RLS verification, OWASP check |
| Phase 5: Deploy | ⏳ PENDING | Vercel + fmos.fortunemarq.com + WhatsApp webhook |

---

## 3. WhatsApp Cloud API Status (as of 2026-06-14)

| Item | Status |
|---|---|
| Dedicated number | +91 79759 18980 (NEVER install WhatsApp on this SIM) |
| PHONE_NUMBER_ID | `1084263481446667` |
| WABA | FortuneMarq `1499408311884474` |
| Meta App | FMOS `1713470496330818` |
| Business Verification | APPROVED ✓ |
| India payment method | ADDED ✓ (VISA card via Billing Hub → "select existing") |
| First real message | DELIVERED end-to-end ✓ (`hello_world` to 93530 82656) |
| Template type_a/b/c | APPROVED/active ✓ |
| Template type_d | Resubmitted → in review |
| Display name "FortuneMarq" | Auto-rejected (thin online presence). Appeal with GST+Udyam docs. NOT a blocker. |
| Webhook URL (inbound) | ⏳ Configure AFTER deploy: Meta App → Configuration → `https://<domain>/api/webhooks/whatsapp` |
| Stale duplicate WABAs to delete | `1852036272835920` (Test) + `705784465410369` (stray dup) |

**`lib/whatsapp/send.ts` exists** — `sendWhatsAppTemplate`, `sendWhatsAppDocument`, `sendWhatsAppButtons`, `uploadWhatsAppMedia` all built. **Zero UI callers exist.** The outbound WhatsApp send UI is a Phase 2 task.

**Named parameter format** (required for templates — do NOT use positional `{{1}}`):
```ts
components: [{ type: 'body', parameters: [
  { type: 'text', parameter_name: 'business_name', text: '...' },
  { type: 'text', parameter_name: 'niche', text: '...' },
  { type: 'text', parameter_name: 'city', text: '...' }
]}]
```

---

## 4. Phase 2 — New Features (NEXT — priority order)

### P0 — Auth Middleware (REQUIRED before deploy or live testing)
**File to create:** `middleware.ts` in `fmos/` root.
- Redirect unauthenticated users → `/login` for all routes except `/login`, `/lp/**`, `/api/inbound/**`, `/api/webhooks/**`
- Role enforcement: `/admin/**` → role=admin, `/telecaller/**` → role=telecaller|admin, `/manager/**` → role=manager|admin|pm, `/client/**` → role=client
- Use `createServerClient` from `@supabase/ssr` with `request.cookies` (not the cookie-wrapper)
- Pattern: check `supabase.auth.getUser()`, if no user → redirect. If user, check `profiles.role` → redirect if wrong role.
- After building, verify Supabase RLS blocks cross-role reads as defense-in-depth.

### P1 — Outbound WhatsApp Send UI
- Telecaller cockpit: "Send via WhatsApp" button after logging outcome
  - Shows template selector (type_a/b/c based on lead type)
  - Fills named params from lead data (business_name, niche, city)
  - Calls `sendWhatsAppTemplate` from `lib/whatsapp/send.ts`
  - Logs to `whatsapp_logs` (already done in send.ts)
- Admin agreements page: "Send Agreement via WhatsApp" — `sendWhatsAppDocument` with agreement PDF URL

### P2 — Real PDF for Proposals & Agreements
- Invoices already use `@react-pdf/renderer` (see `components/admin/finance/InvoicePDF.tsx`)
- Build `components/proposals/ProposalPDF.tsx` + `components/admin/agreements/AgreementPDF.tsx` using the same pattern
- Server action to generate + upload to Supabase Storage → return URL → `sendWhatsAppDocument`

### P3 — Industry-Grade CRM Features (after P0/P1/P2)
In rough priority:
1. **Lead scoring** — auto-score 1–10 based on: source (inbound > cold), engagement (call outcomes), company size signals, days in pipeline
2. **Pipeline velocity dashboard** — avg days per stage, conversion rates, bottleneck identification
3. **Client health score** — composite from invoice payment timeliness + task completion + renewal proximity
4. **Bulk WhatsApp broadcast** — send template to filtered lead segment
5. **Deal probability %** — on proposals, ML-lite (age + source + stage = probability)
6. **Automated follow-up reminders** — cron checks `follow_up_date` and creates notifications
7. **Team leaderboard (live)** — real-time ranking, not just weekly scorecard
8. **Client portal notifications** — when project milestone completed, send WhatsApp + portal banner
9. **Inbound lead SLA tracking** — speed-to-lead alerts if not contacted within 30 min
10. **GSC integration** — organic SEO tab currently shows "not connected" placeholder; integrate Search Console API

---

## 5. Key Files Reference

| File | Purpose |
|---|---|
| `CLAUDE.md` | Full app context, all routes, all DB tables, conventions |
| `COWORK_HANDOFF.md` | **This file** — master state + next steps |
| `EXTERNAL_SETUP_GUIDE.md` | **All external setup** — accounts, API keys, plans, integrations to do outside the code before go-live |
| `last_session.md` | Summary of the most recent session |
| `FMOS_QA_VERIFICATION_2026-06-13.md` | Detailed audit report — P0/P1/P2 gap list |
| `DEPLOY_VERCEL.md` | Step-by-step Vercel deploy guide |
| `UI_UX_GUIDELINES.md` | Design system rules |
| `lib/pipeline.ts` | Single source of truth for lead stage/status writes |
| `lib/whatsapp/send.ts` | WhatsApp send functions (text/template/buttons/document/media) |
| `lib/inbound/capture.ts` | Inbound lead pipeline (dedupe → assign → notify) |
| `components/ui/prompt-modal.tsx` | Modal for all confirmations (replaces browser confirm) |
| `types/database.types.ts` | Supabase generated types (112 tables) |
| `supabase/2026-06-12_full_schema_sync.sql` | Master SQL — append new DDL here, run in dashboard |

---

## 6. Deploy Checklist (when ready)

- [ ] `middleware.ts` built and tested locally
- [ ] Runtime smoke test complete (see `FMOS_QA_VERIFICATION_2026-06-13.md` §D)
- [ ] Commit all changes to `master` branch
- [ ] Vercel: New Project → import `FortuneMarq-Build` → Root Directory = `01_CRM_AND_TOOL/fmos`
- [ ] Add 10 env vars to Vercel (copy from `.env.local`)
- [ ] Custom domain `fmos.fortunemarq.com` → Hostinger CNAME → Supabase auth redirect URLs updated
- [ ] Post-deploy: configure WhatsApp webhook in Meta App (callback URL + subscribe `messages`)
- [ ] Test inbound: send real message to +91 79759 18980 → confirm it lands in FMOS cockpit

---

## 7. Uncommitted Changes

Everything from the 2026-06-14 bug-fix session is modified but **NOT committed**.
Run this when Jabeer greenlights the commit:
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
git add -A
git commit -m "Phase 1 complete: all critical bugs fixed, TypeScript 0 errors (2026-06-14)"
git push origin master
```

---

## 8. Key IDs (no secrets)

| Thing | Value |
|---|---|
| Cloud API number | +91 79759 18980 |
| PHONE_NUMBER_ID | `1084263481446667` |
| WABA (real) | FortuneMarq `1499408311884474` |
| Meta App | FMOS `1713470496330818` |
| Business Manager | `879084085296794` |
| Supabase project | `cnwooodktqwvpzkucskm` |
| GitHub repo | github.com/sayedjabeer/FortuneMarq-Build (private, branch: master) |
| GSTIN | 29ICWPS9816Q1ZS |
| Vercel root dir | `01_CRM_AND_TOOL/fmos` |
| `.env.local` location | `C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos\.env.local` (Windows only, gitignored) |
