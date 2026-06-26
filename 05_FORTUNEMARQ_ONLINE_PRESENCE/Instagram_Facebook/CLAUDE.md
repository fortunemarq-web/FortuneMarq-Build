# Instagram + Facebook — Working guide

FortuneMarq's own Instagram & Facebook presence — authority in Hubli's market + inbound leads.
Right now this is **manual** (plan/draft here, post by hand). `CONTEXT.md` = inventory; this file = how to work here.

## How it connects to the rest
- Inbound channel: DMs/comments/profile clicks → leads. When they reach FMOS they're tagged `source: instagram` / `source: facebook`.
- Same playbook is a **service we sell** (social content) — what we learn here feeds the client version.

## The manual workflow (now)
Plan and draft here; publish in the IG/FB apps. Draft files live in the format subfolders:
- `Carousels/` — multi-slide educational/proof posts
- `Reels/` — short video (5–90s, 9:16)
- `Single_Image/` — one-image tips/offers/updates

Per post, capture: hook, caption, hashtags, CTA, image/video source (heavy files → Google Drive, linked), and post date.
Cadence target: consistent weekly posting. Voice: plain, honest, business-owner-friendly — no fake stats, no "we're #1", no war/combat language.

## ⚠️ Future plan — Meta Graph API automation (build later, most valuable for clients)
Free at the platform level; **OAuth-based**; needs an IG **Business** account linked to a Facebook Page, a Meta developer app, and **App Review (~2–4 weeks, start early)**. What to build (env-gated in FMOS, like the ad-conversion uploader):
- **Scheduled publishing** — image/carousel/reel/story to IG + FB from a content calendar (API posts immediately → FMOS cron does the scheduling).
- **Insights pull** — reach/impressions/follower growth/engagement → presence dashboard + client monthly reports.
- **DM automation — highest ROI, infra already exists.** FMOS already has the unified inbox (6.2–6.4) + AI bot (6.1, `01_CRM_AND_TOOL/fmos/lib/bot/engine.ts`) designed for web + WhatsApp + **IG/Messenger**. Extending it to IG/Messenger DMs = auto-answer, booking, and lead capture (`source: instagram`) like WhatsApp does today. **Do this one first.**
- **Comment moderation / auto-reply.**
- **For clients:** one OAuth integration manages many client accounts (must be admin of each client's Page/IG Business account); our own accounts = account #1.
- Gotcha: **Reels publishing needs a Business account** (not Creator). Limit 100 posts/24h (plenty).

## Boundaries
- Planning/drafts only — no passwords or OAuth tokens stored here. Heavy media → Drive, linked.
