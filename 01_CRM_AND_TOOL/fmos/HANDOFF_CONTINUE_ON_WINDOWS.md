# FMOS / FortuneMarq — Continuation Handoff
**Written:** 2026-06-14 · **For:** Jabeer, continuing on the Windows PC
**Read this first. It is the single source of truth for current state + next steps.**

---

## 0. Where things live (READ THIS — machine setup)
- **The repo + secrets are on the MAC**: `~/Desktop/FortuneMarq-Build` (app in `01_CRM_AND_TOOL/fmos`). The Mac hostname is `FortuneMarqs-Mac-mini`.
- **`.env.local` (all tokens/keys) is on the Mac only — it is NOT in git** (correctly gitignored). So real credentials exist *only* on the Mac.
- **You are on Windows**, reaching the Mac via **Chrome Remote Desktop**, with the Meta/Facebook dashboard open in the Windows Chrome directly.

**Recommendation:** keep running terminal commands **on the Mac** (through Chrome Remote Desktop), because `.env.local` lives there. If you ever want to work natively on Windows, you must `git clone` the repo and **recreate `.env.local`** by hand (the values are only on the Mac / in Meta + Supabase dashboards).

**Command note:** the commands below are **macOS/bash** (run them in the Mac Terminal). Windows PowerShell equivalents are given where it matters.

---

## 1. CURRENT STATE (one-screen summary)

### ✅ WhatsApp Cloud API — LIVE & PROVEN
- Dedicated number **+91 79759 18980** runs the Cloud API. **+91 93530 82656 stays in the WhatsApp Business app** for manual chats — **NEVER install WhatsApp on the new SIM.**
- **Registered ✓ · Business Verification APPROVED ✓ · India payment method ADDED ✓ (VISA \*1564) · first real `hello_world` message DELIVERED end-to-end ✓.**
- Templates: `direct_report_type_a/b/c` **APPROVED/active**; `direct_report_type_d` **resubmitted → in review**.
- Quality rating: **High**.

### 🟡 WhatsApp — small items still open (none block sending)
1. **`direct_report_type_d`** — wait for Meta approval (check WhatsApp Manager → Manage templates).
2. **Display name** — "FortuneMarq" auto-rejected. `&` is blocked by the validator; "and" version also auto-rejected. Likely cause: thin online presence. **Appeal route:** Meta/WhatsApp Business Support with GST + Udyam docs. Not a blocker — sending works, profile shows "FortuneMarq" + logo.
3. **Clean up duplicate WABAs** (Billing → Accounts → WhatsApp Business accounts): the **Test** WABA `1852036272835920` and stray dup **"Fortunemarq"** `705784465410369`. Keep the real one: **FortuneMarq `1499408311884474`**.
4. **Inbound webhook callback URL** — only after FMOS is deployed (needs a public URL). See §4.

### 🔴 FMOS app — NOT deployed; deploy is GATED on QA
- Static QA done: `FMOS_QA_VERIFICATION_2026-06-13.md`. App is solidly built; tsc 0 errors; old critical bugs fixed.
- **P0 blocker before any public deploy:** page-level **auth/RBAC is missing** (no `middleware.ts`; ~40 admin pages have no login/role gate — data safety currently rests only on Supabase RLS; mutations are gated by `requireAdmin`).
- **P1 gap:** outbound-WhatsApp send UI is **unbuilt** (send library exists, nothing calls it). Proposal/agreement "PDFs" are browser-print only (invoices are real PDFs).

---

## 2. Key IDs & references (no secrets here)
| Thing | Value |
|---|---|
| Cloud API number | +91 79759 18980 |
| PHONE_NUMBER_ID | `1084263481446667` |
| WABA (real) | FortuneMarq `1499408311884474` |
| Meta App | FMOS `1713470496330818` |
| Business Manager portfolio | `879084085296794` |
| Supabase project | `cnwooodktqwvpzkucskm` |
| GitHub repo | github.com/sayedjabeer/FortuneMarq-Build (private) |
| App subfolder (Vercel root dir) | `01_CRM_AND_TOOL/fmos` |
| GSTIN | 29ICWPS9816Q1ZS |
| Secrets location | `01_CRM_AND_TOOL/fmos/.env.local` (Mac only) |

**Re-run the proven WhatsApp test send** (Mac Terminal):
```bash
cd "/Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos" && \
TOKEN=$(grep '^WHATSAPP_API_TOKEN=' .env.local | cut -d= -f2-) && \
PNID=$(grep '^WHATSAPP_PHONE_NUMBER_ID=' .env.local | cut -d= -f2-) && \
curl -s -X POST "https://graph.facebook.com/v23.0/${PNID}/messages" \
 -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
 -d '{"messaging_product":"whatsapp","to":"919353082656","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'
```

---

## 3. NEXT STEPS — priority order

### Step 1 — Fix the P0 auth gap (REQUIRED before deploy)
Add a `middleware.ts` to `01_CRM_AND_TOOL/fmos/` that:
- redirects unauthenticated users to `/login`, and
- enforces role-based access per section (`/admin` → admin only; `/telecaller`, `/manager`, `/client` to their roles).
Then verify Supabase RLS blocks cross-role reads as defense-in-depth.
*(This is a code task — a Claude session can implement it. Ask: "implement the P0 auth middleware from the QA report.")*

### Step 2 — Runtime smoke test (locally, before deploy)
On the Mac: `cd 01_CRM_AND_TOOL/fmos && npm run dev` → http://localhost:3000.
Work through the checklist in **`FMOS_QA_VERIFICATION_2026-06-13.md` §D** (auth/RBAC, admin modules, telecaller cockpit, inbound curl test).

### Step 3 — Deploy to Vercel
Follow **`DEPLOY_VERCEL.md`** exactly. Key points:
- First commit + push pending changes (see §5 below).
- Vercel → New Project → import `FortuneMarq-Build` → **Root Directory = `01_CRM_AND_TOOL/fmos`**.
- Add the **10 env vars** (copy values from `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `INBOUND_WEBHOOK_SECRET`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`.
- Add domain `fmos.fortunemarq.com` → set Hostinger CNAME → add domain to Supabase auth redirect URLs.

### Step 4 — Post-deploy WhatsApp inbound webhook
Meta App FMOS → WhatsApp → Configuration → Callback URL `https://fmos.fortunemarq.com/api/webhooks/whatsapp`, verify token = `WHATSAPP_VERIFY_TOKEN` from `.env.local` → Verify & save → subscribe to the `messages` field. Then send a real message to 79759 18980 to confirm inbound lands in FMOS.

### Step 5 — Decide P1 scope
Build the outbound-WhatsApp send UI (report/proposal/invoice via WhatsApp) **now** or **after launch**? It's externally gated anyway until type_d approves. Recommendation: launch the CRM first, add the send flow after.

### Step 6 — Marketing prerequisites (Meta + Google) — after deploy
Not yet started. Will need: ad accounts + billing, Meta Pixel/CAPI + Google conversion tracking on fortunemarq.com, lead forms, the Meta leadgen + Google lead webhooks into `/api/inbound/[channel]`, niche landing pages live, UTM/attribution conventions.

---

## 4. Important gotchas (learned the hard way)
- **WABA payment:** a brand-new card entered at the WhatsApp/WABA level fails RBI **e-mandate**; the card that worked was added via **Billing Hub** then **"select existing card"** for the real WABA. Use a **credit card** (VISA worked; the MasterCard *debit* failed). Card first landed on the **Test** WABA by mistake — make sure it's on the **real** WABA `1499408311884474`.
- **Template rules:** MARKETING category, Document header, 2 quick-reply buttons; **named vars used once each**, no leading/trailing variable, no `&`. Duplicate an approved template to avoid format errors.
- **"accepted" ≠ delivered:** the Graph API returns `accepted` even when undeliverable (e.g., no payment method). Always confirm on the handset.

---

## 5. Uncommitted work (commit only when deploy is greenlit)
These are modified/new but **not committed** (stale git lock was cleared earlier; if it returns, `rm -f .git/index.lock`):
- Code: `app/sales/page.tsx`, `components/sales/telecaller-cockpit.tsx`, `next.config.ts` (added prod serverAction origins).
- Docs: `COWORK_HANDOFF.md`, `last_session.md`, and the 3 new docs (`FMOS_QA_VERIFICATION_2026-06-13.md`, `DEPLOY_VERCEL.md`, this file), plus master-doc updates in `00_MASTER/`.

Commit (Mac Terminal):
```bash
cd "/Users/fortunemarq/Desktop/FortuneMarq-Build"
rm -f .git/index.lock
git add -A   # or stage selectively
git commit -m "WhatsApp Cloud API live; FMOS QA + deploy docs; doc sweep (2026-06-14)"
git push origin main
```
Windows PowerShell equivalent (if working natively on Windows): same `git` commands, but use `Remove-Item .git/index.lock -ErrorAction SilentlyContinue` instead of `rm -f`.

---

## 6. Authoritative docs (current)
- **This file** — start here.
- `FMOS_QA_VERIFICATION_2026-06-13.md` — full QA findings + runtime checklist.
- `DEPLOY_VERCEL.md` — step-by-step deploy.
- `COWORK_HANDOFF.md` — deep technical state (Phase F, schema, WhatsApp internals).
- `00_MASTER/MASTER_CONTEXT.md`, `00_MASTER/CRITICAL_PATH.md`, `00_MASTER/PENDING_ACTIONS.md` — project-wide state (updated 2026-06-14).
- *(Deleted as superseded: `FMOS_App_Audit_Report.md` (May audit), `00_MASTER/SESSION_HANDOFF_2026-06-08.md` — recoverable via git history if needed.)*
