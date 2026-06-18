# ▶ DEPLOY HANDOFF — resume here (2026-06-18)

A fresh Claude Code session continues from this exact point. Read this fully, then continue the
go-live. The owner is **not a developer** — do the technical work, explain plainly, and get an explicit
OK before anything that hits the live system.

## Where we are — MID-DEPLOY
The fortunemarq.com marketing-site rebuild (+ blog + legacy redirects + the `Website/` control-room
folder) is **built, QA'd, and committed** on branch `continue-on-mac`. We are part-way through go-live.

**Exact git state:**
- `continue-on-mac` is **pushed to GitHub** (`origin/continue-on-mac`), secret-free. It is **80 commits
  ahead of `main`**.
- `main` is the currently-LIVE deploy on Vercel (serves `fmos.fortunemarq.com`, the CRM). Marketing site
  + CRM are **one Vercel app**.
- Build verified green (`npm run build`), `npx tsc --noEmit` = 0.

## ✅ PRODUCTION DEPLOY — TRIGGERED (2026-06-18)
`origin/main` was fast-forwarded to `continue-on-mac`'s tip via `git push origin continue-on-mac:main` (no
local checkout — keeps the working tree's pre-existing changes untouched). **Vercel is deploying `main` →
production.** This refreshed the live CRM (`fmos.fortunemarq.com`) too — verify it still loads + login works.
Build was green locally (`npm run build`, `tsc` 0). The marketing site stays **dormant until DNS cutover** —
`fortunemarq.com` still points at Hostinger until step 1/2 below.

## Then — the owner's dashboard steps (guide them, you can't access these)
1. **Vercel** → project → Settings → **Domains** → add `fortunemarq.com` + `www` → it shows DNS records.
2. **Hostinger** → DNS → point `fortunemarq.com` + `www` at those Vercel records. **Keep the old site files
   as backup — do NOT delete.** (Revert DNS = instantly back on the old site if anything's wrong.)
3. Wait for DNS + Vercel SSL → `fortunemarq.com` serves the new site. Test it.
4. **Google Search Console** → submit `sitemap.xml` + request indexing. **Analytics** → set
   `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_CLARITY_ID` / `NEXT_PUBLIC_META_PIXEL_ID` in Vercel when ready.

**Env vars:** none strictly required — the marketing site defaults to `https://fortunemarq.com`. Just make
sure **`MARKETING_PREVIEW_LOCAL` is NOT set in Vercel** (it lives only in local `.env.local`).

## ✅ Security incident — RESOLVED (context)
A Google OAuth client secret was hardcoded in a one-time helper, `get-google-token.js` (under the fmos
`scripts/` folder), and committed long ago. GitHub push-protection caught it (it never reached GitHub). Actions taken:
- Owner **rotated** the secret in Google Cloud Console. **Confirm they updated `GOOGLE_CLIENT_SECRET` in
  Vercel AND local `.env.local`** (the existing `GOOGLE_REFRESH_TOKEN` stays valid, so booking keeps working).
- The file was scrubbed (reads from env) and **purged from git history** (filter-branch); the helper file no
  longer exists in the repo. Local history secret count = 0.

## Invariants still in force
- WhatsApp is locked to test numbers `8904192656` + `9353082656` (`WHATSAPP_SEND_MODE=test` + allowlist)
  until `WHATSAPP_LAUNCH=1`. **WhatsApp bot go-live is a SEPARATE switch** — not part of this deploy.
- The owner has authorized the deploy (merge to main + DNS cutover). That lifts the earlier
  "don't push to main / don't touch Hostinger" holds **for this go-live only**.

## Heads-up
- There are **pre-existing uncommitted changes** not part of this deploy (a `components/sales/
  telecaller-cockpit.tsx` edit that wires `bookMeeting` into the cockpit, plus `.gitignore` etc.). They were
  in the tree at session start — **leave them; they don't deploy** (only committed work does).

## Key files to read first
- `01_CRM_AND_TOOL/fmos/app/site/README.md` — the canonical marketing-site handoff (architecture + history).
- `Website/CLAUDE.md` (+ `Website/Website-Changes/CLAUDE.md`, `Website/Add-Blogs/CLAUDE.md`) — the owner's
  control-room manuals for ongoing changes + blogging.
- `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` — broader project state.
