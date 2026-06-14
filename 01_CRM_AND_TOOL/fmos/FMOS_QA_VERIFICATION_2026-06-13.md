# FMOS — QA / Feature Verification Report
**Date:** 2026-06-13 · **Build:** v4.9 (+ uncommitted cockpit/sales tweaks) · **App:** `agency-os` (Next.js 16)

## Method & scope
Static code audit of the live codebase — all routes, components, lib modules, auth wiring, and DB calls read directly. TypeScript: **0 errors** (full `tsc --noEmit`). Surface: **82 page routes, 24 API routes, 135 components, 35 lib modules, 15 server-action files.**

⚠️ This is a **code-level verification** (present + correctly wired). The app was **not run** this session, so "working" items are *verified-by-inspection*, not runtime-confirmed. A runtime smoke-test checklist is in Section D.

---

## VERDICT
The core app is **genuinely built and the prior critical bugs are fixed.** It is **not deploy-ready yet**, for three reasons:
1. **P0 — page-level authentication/authorization is missing** (must fix or prove RLS covers it).
2. **P1 — the outbound-WhatsApp sales flow is unbuilt** and proposal/agreement PDFs are print-only (decision needed on scope).
3. **No runtime smoke test has been run** — required before going live.

---

## A. Verified present & correctly wired (by inspection)
- **Admin dashboard** — KPIs now read `total_amount` (the old `amount` bug is fixed), "Follow-ups due today" section present, meetings/overdue queries corrected.
- **Telecaller cockpit** — now writes `outreach_stage` (not `status`) with correct `unreachable`/`no_answer`/`gatekeeper` mapping; stage-sync to the outreach board is fixed. Quick-add source picker + speed-to-lead stamping present.
- **Outreach board, lead profiles, PDF log** — present and wired.
- **Proposals / Agreements / Clients** — creators, row actions, client profile tabs, onboarding, asset vault, renewals/upsell all present.
- **Finance** — invoices (with **real generated PDF** via `@react-pdf/renderer`), expenses, P&L, GST, partial-payment recording.
- **Team management** — invite/role/reset/activate/remove, all `requireAdmin`-gated + audit-logged.
- **Manager performance** — real data from `outreach_logs` (no longer hardcoded).
- **Marketing hub** — inbound-funnel tab, channel scoreboard, UTM builder, spend CSV import, campaign CRUD.
- **Inbound pipeline** — `/api/inbound/[channel]` webhook → `processInboundLead` → dedupe → auto-campaign → round-robin assign → notify. Google lead-form adapter included.
- **WhatsApp inbound** — `/api/webhooks/whatsapp` handshake + HMAC verify + auto-replies (text/buttons) wired.
- **Attendance, tasks/projects, strategist, manager pipeline, client portal, notifications, daily-digest + admin-alerts crons** — present.
- **Tech debt is low:** no real TODO/FIXME backlog (the 4 matches are benign), 13 stray `console.log`.

---

## B. Findings by severity

### 🔴 P0 — Blockers (resolve or verify before deploy)
**1. Page-level auth & role-based access control is effectively absent.**
- No `middleware.ts`; root `app/layout.tsx` has no auth gate; `createServerClientWithCookies()` reads cookies but does **not** redirect on a missing session.
- ~40 admin pages have **no login/role check**, including `app/admin/page.tsx` (dashboard), `finance/*`, `users`, `team`, `settings`, `audit-log`, `agreements`.
- Mutations *are* protected (`requireAdmin` in server actions). But **page reads are not** — protection rests entirely on Supabase RLS.
- **Risk:** a logged-out user hitting `/admin` gets the page shell; a logged-in non-admin (e.g. a telecaller) could load admin URLs and see whatever RLS allows.
- **Fix:** add `middleware.ts` to (a) redirect unauthenticated → `/login`, and (b) enforce role per section (`/admin`, `/telecaller`, `/manager`, `/client`). Then **verify RLS** blocks cross-role reads as defense-in-depth.

### 🟠 P1 — Important functional gaps
**2. Outbound WhatsApp send is not wired into any UI.** Zero callers of `sendWhatsAppTemplate` / `sendWhatsAppDocument`. The whole "send report / proposal / agreement / invoice PDF + template message via WhatsApp from FMOS" flow (the *FMOS WhatsApp Button Flow* requirements in PENDING_ACTIONS) is **unbuilt**. The send library exists; the buttons/modals do not. (Also externally blocked right now by template approval + billing.)

**3. Proposal & Agreement "PDF" = browser print only** (`window.print()`), unlike invoices which generate a real PDF. Print works for a human but produces no file that can be auto-attached/sent — so it can't feed the WhatsApp document flow without a generation step.

**4. Client reports are link/URL-based** — no generated report document.

**5. Ad-spend CSV import never tested with a real Meta/Google export** (parser written for standard headers; needs a real file).

### 🟡 P2 — Polish / minor
6. ~20 native `confirm()` dialogs remain (functional, but convention is the `promptModal`).
7. "Coming soon" placeholders: `strategy/archive` View-Document link; niche-kit/landing-page URLs fall back to "[Link Coming Soon]" (tied to the LP redesign not being live).
8. Cosmetic placeholders: landing-page VSL video block, `growth/seo` strategy panel, `staff` name fallback.
9. 13 `console.log` statements to strip.
10. `database.types.ts` regen pending (2 TODO notes) — cosmetic; code uses service-role casts.

---

## C. Must verify at RUNTIME (cannot confirm from code)
- Login works and **role redirects** actually block non-admins from admin URLs (ties to P0).
- Each module renders with live Supabase data; **writes persist** (create/edit a lead, invoice, task).
- Crons execute (`daily-digest`, `admin-alerts`).
- Inbound webhook → lead → assign → notify chain end-to-end (was tested during the build session).
- WhatsApp inbound webhook (needs a public URL → only testable after deploy).

---

## D. Runtime smoke-test checklist
Run locally: `cd 01_CRM_AND_TOOL/fmos && npm run dev` → http://localhost:3000

**Auth / RBAC**
- [ ] Logged out, visit `/admin` → should redirect to `/login` (currently likely does NOT — P0).
- [ ] Log in as telecaller → try `/admin/finance`, `/admin/users` → should be blocked.
- [ ] Log in as each role (admin / telecaller / staff / client) → correct home + sidebar.

**Admin**
- [ ] Dashboard KPIs show real ₹ (MRR, outstanding, overdue) — not ₹0.
- [ ] Leads list loads; open a lead; edit a field → persists.
- [ ] Outreach board renders; drag a card → stage saves.
- [ ] Finance: invoice list, generate MRR invoices, download an invoice PDF, record a partial payment.
- [ ] Proposals: create one, "Download PDF" (print) renders cleanly.
- [ ] Agreements: open one, print view renders.
- [ ] Clients: profile tabs (overview/onboarding/assets/finance) load.
- [ ] Marketing hub: inbound-funnel KPIs, import a real spend CSV.
- [ ] Team: add a temp member, change role, remove (cleanup).

**Telecaller**
- [ ] Cockpit loads queue; log each outcome → lead moves to correct board stage.
- [ ] Follow-ups / no-answer / unreachable filters work.
- [ ] my-stats shows today's counts.

**Inbound (local curl)**
```bash
cd 01_CRM_AND_TOOL/fmos
curl -X POST http://localhost:3000/api/inbound/test \
  -H "Authorization: Bearer $(grep INBOUND_WEBHOOK_SECRET .env.local | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"name":"QA Test","phone":"9876500123","niche":"Gym","city":"Hubli","utm":{"campaign":"qa"}}'
```
- [ ] Lead created + assigned + notification; duplicate phone → re-enquiry, no new lead. (Delete test lead after.)

---

## E. Recommendation
1. **Fix P0 auth gating** (add `middleware.ts` + verify RLS) — non-negotiable before a public deploy.
2. **Decide P1 scope:** build the outbound-WhatsApp UI + proposal/agreement PDF generation **now**, or launch the CRM first and add the WhatsApp send flow after billing/templates clear. (It's externally blocked today regardless.)
3. **Run the Section D smoke test.**
4. **Then deploy** (guide already written: `DEPLOY_VERCEL.md`).

*Static audit complete. Runtime verification pending.*
