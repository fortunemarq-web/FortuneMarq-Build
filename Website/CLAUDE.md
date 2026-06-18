# FortuneMarq Website — Control Room

This folder is the **control room** for the FortuneMarq public website (fortunemarq.com).
When the owner opens this folder in Claude Code, **you (Claude) do the technical work**. The
owner is **not a developer** — explain things in plain English and never make them touch code.

This folder is just instructions. The **actual website code lives elsewhere in this repo:**
`01_CRM_AND_TOOL/fmos` — run all commands (tsc, build, dev, git) from there. The public site
specifically lives under `01_CRM_AND_TOOL/fmos/app/site` and `01_CRM_AND_TOOL/fmos/components/site`.

## ▶ Before doing anything, read these
1. `01_CRM_AND_TOOL/fmos/app/site/README.md` — the full website architecture + history (read it fully).
2. Then the CLAUDE.md for the job you're doing:
   - Changing the website → `Website-Changes/CLAUDE.md`
   - Writing / publishing a blog → `Add-Blogs/CLAUDE.md`

## The two jobs
- **`Website-Changes/`** — edit text, images, links, sections, pricing, tracking/marketing codes.
- **`Add-Blogs/`** — write and publish blog posts.

## 🔴 Golden rules — never break these
1. **This is a LIVE business site wired to the FMOS CRM.** A bad change can break the site OR stop
   leads from reaching the CRM. Be careful, change the minimum, and verify.
2. **Only touch the website.** Everything outside the site files is OFF LIMITS — the FMOS app, the
   lead pipeline, the auth gate, the WhatsApp bot, and the Supabase database connection. Each
   sub-folder's CLAUDE.md has the exact "do not touch" list.
3. **Always verify before pushing.** From `01_CRM_AND_TOOL/fmos` run both:
   ```
   npx tsc --noEmit
   npm run build
   ```
   If EITHER fails, DO NOT push — fix it first. (A broken build won't deploy anyway, but never push broken code.)
4. **Keep the brand.** Background `#030303`, green `#42CA80`, Alliance + JetBrains Mono fonts,
   "confident and plain" tone — NO war / combat / "dominate" language.
5. **Deploy = `git push` to `main`.** Pushing to `main` makes Vercel rebuild and go live in ~2 minutes.
   Only push when tsc + build are green and the owner has approved the change.

## How a change goes live (the loop)
1. Owner describes what they want, in plain English.
2. You make the smallest edit that does it, in the right file.
3. You verify: `npx tsc --noEmit` + `npm run build` (both green).
4. You show the owner what changed, then commit and push to `main`.
5. Vercel deploys → live on fortunemarq.com in ~2 minutes.

## Git / deploy facts
- Repo root: the `FortuneMarq-Build` folder (this folder's parent). `git` works from anywhere inside it.
- The live site deploys from the **`main`** branch via Vercel. After the migration, `main` is what's live.
- End every commit message with the project's standard co-author line if you're unsure — keep messages short and factual.
