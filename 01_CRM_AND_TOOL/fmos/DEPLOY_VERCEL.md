# FMOS — Vercel Deployment Guide
**App:** `agency-os` (Next.js 16) · **Repo:** github.com/fortunemarq-web/FortuneMarq-Build
**App lives in subfolder:** `01_CRM_AND_TOOL/fmos` ← this is the Vercel **Root Directory**
**Target domain:** `fmos.fortunemarq.com`

---

## 0. Pre-flight (do first)
1. Confirm the GitHub repo is **Private** (Settings → General → Danger Zone → Change visibility). The repo contains lead PII.
2. Commit + push the latest app changes (cockpit, sales page, next.config).
   On Windows (PowerShell), from the repo root `C:\Users\sayed\FortuneMarq-Build`:
   ```powershell
   git add 01_CRM_AND_TOOL/fmos/app/sales/page.tsx `
           01_CRM_AND_TOOL/fmos/components/sales/telecaller-cockpit.tsx `
           01_CRM_AND_TOOL/fmos/next.config.ts
   git commit -m "FMOS: cockpit + sales updates, prod serverAction origins (pre-deploy)"
   git push origin main
   ```

---

## 1. Create the Vercel project
1. Go to https://vercel.com → **Sign Up / Log in** → **Continue with GitHub** (use the GitHub account that owns the repo).
2. **Add New… → Project**.
3. Find **FortuneMarq-Build** in the repo list → **Import**.
   - If the repo doesn't appear: **Adjust GitHub App Permissions** → grant Vercel access to this repo.

## 2. Configure the project (CRITICAL settings)
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** click **Edit** → set to `01_CRM_AND_TOOL/fmos`  ← **must do this**, or the build fails
- **Build Command:** leave default (`next build`)
- **Install Command:** leave default
- **Output Directory:** leave default

## 3. Environment Variables
Add all 10 below. Copy each VALUE from `01_CRM_AND_TOOL/fmos/.env.local` on your Mac.
Set every one for **Production, Preview, and Development**.

| Key | Type | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | Full DB access — never expose client-side |
| `ANTHROPIC_API_KEY` | **secret** | AI features |
| `CRON_SECRET` | **secret** | Secures Vercel cron routes |
| `INBOUND_WEBHOOK_SECRET` | **secret** | Auth for `/api/inbound/[channel]` |
| `WHATSAPP_API_TOKEN` | **secret** | Permanent system-user token |
| `WHATSAPP_PHONE_NUMBER_ID` | secret | `1084263481446667` |
| `WHATSAPP_VERIFY_TOKEN` | **secret** | Webhook handshake token |
| `META_APP_SECRET` | **secret** | Webhook HMAC verification |

## 4. Deploy
Click **Deploy**. Watch the build log.
- If it fails, copy the error — most failures are a missing env var or the Root Directory not set to `01_CRM_AND_TOOL/fmos`.

## 5. Post-deploy wiring
1. **Custom domain:** Project → Settings → Domains → add `fmos.fortunemarq.com`. Vercel shows a CNAME (usually `cname.vercel-dns.com`).
2. **DNS (Hostinger):** add a CNAME record: `fmos` → the value Vercel gave. Wait for "Valid Configuration".
3. **Supabase auth redirect:** Supabase dashboard → Authentication → URL Configuration → add `https://fmos.fortunemarq.com` to Site URL + Redirect URLs (and the `*.vercel.app` deploy URL).
4. **Cron:** vercel.json already defines daily-digest (03:30) + admin-alerts (03:00). Vercel auto-registers them; they pass `CRON_SECRET` automatically.

## 6. Smoke test (after live)
- Log in at https://fmos.fortunemarq.com (existing users: sayedjabeer@, afifa@, admin1@, admin2@fmos.com)
- Check: dashboard loads, leads list, telecaller cockpit, admin pages, a test write (create/edit a lead).
- Test inbound webhook:
  ```bash
  curl -X POST https://fmos.fortunemarq.com/api/inbound/test \
    -H "Authorization: Bearer <INBOUND_WEBHOOK_SECRET>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Deploy Test","phone":"9876500099","niche":"Gym","city":"Hubli"}'
  ```
- Bulk-import remaining leads at `/admin/bulk-import`.

---
*Generated for the FMOS deploy session, 2026-06-13.*
