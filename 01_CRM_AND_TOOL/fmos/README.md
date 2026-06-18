# FMOS — FortuneMarq Marketing Operating System

FMOS is the in-house CRM and operations platform for **FortuneMarq**, a digital
marketing agency in Hubli, Karnataka. It covers the full agency lifecycle — lead
calling → outreach → meetings → proposals → agreements → client management →
finance → team — plus the agency's own inbound-marketing engine. Built with
**Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**
(Postgres + Auth + RLS), with Claude (Anthropic) powering the AI features. It is
deployed on **Vercel** and reached at `fmos.fortunemarq.com`.

## Getting started

```bash
npm install
npm run dev      # dev server (binds 0.0.0.0 for LAN/mobile testing) → http://localhost:3000
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

Copy `.env.example` to `.env.local` and fill in the required values (Supabase URL +
keys, `ANTHROPIC_API_KEY`, `CRON_SECRET`, WhatsApp/Meta keys, …) before running.

## Where to look first

- **`CLAUDE.md`** — app map, routes, tables, and the conventions to follow when editing.
- **`CONTINUE_HERE.md`** — the canonical handoff: current project state + next steps (supersedes the older `COWORK_HANDOFF.md`).
- **`APPLICATION_DOCUMENTATION.md`** — full technical reference (schema, routes, components).
- **`lib/pipeline.ts`** — the single source of truth for lead stages; never write
  `outreach_stage`/`status` directly, always go through `leadStageUpdate()` /
  `leadStatusUpdate()`.

## Operational scripts

- **`scripts/bulk_create_whatsapp_templates.py`** — bulk-creates the Meta WhatsApp Business templates from the canonical `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json` (already-approved templates are skipped; safe to re-run).

The telecaller cockpit (`components/sales/telecaller-cockpit.tsx`) logs call outcomes and, on **"Interested — Book Meeting Now"** with a chosen date/time, creates a Google Calendar/Meet booking (`bookMeeting`); every other outcome (and a "book" logged without a time) auto-sends the mapped WhatsApp template instead (3.2 / 3.4).

## WhatsApp sending & the send-mode safety guard

**Current status (2026-06-18):** all outbound WhatsApp goes through `lib/whatsapp/send.ts` (the only module that touches the Graph API). Every send funnels through the `preflight()` choke-point (opt-out + active-inbound suppression + daily-cap/per-minute throttle), and **every** send function — `sendWhatsAppText`, `sendWhatsAppButtons`, `sendWhatsAppDocument`, and `sendWhatsAppTemplate` — now honors the send-mode guard.

- When `WHATSAPP_SEND_MODE=test`, `resolveRecipients()` redirects **all** recipients to `WHATSAPP_TEST_RECIPIENTS`, so no real lead/client number can be messaged from a test run (logged as `[TEST→<realPhone>]`). When the var is absent or `live`, sends go to the real number. Previously only template sends were redirected; the text/buttons/document paths (e.g. the AI bot's booking confirmation in `lib/bot/engine.ts`) are now covered too.
- The same guard applies to the meeting-booking flow end-to-end: `bookMeeting`'s admin alert, the client-facing `meeting_confirmation`, reschedule/no-show confirmations, and the `meeting_reminder_1h`/`_15m` reminders fired by the `scheduled-messages` cron all route through these guarded functions.

## Public site & niche landing pages (Stage 2.1)

**Current status (2026-06-18):** the data-driven niche landing page **Dental Clinics · Hubli** (`/lp/dental-clinics/hubli`, EN + Kannada via `?lang=kn`) is built and verified; per the launch gate only this niche is enabled, other niches pending. The **fortunemarq.com marketing site (5.1) is now fully built** under `app/site/*` (Home / About / Services / Work / Contact / Privacy / Terms + a branded 404), served at clean root paths via a host-split in `proxy.ts` (marketing host → `/site/*`; FMOS app sealed on its own host; `MARKETING_PREVIEW_LOCAL=1` to preview clean URLs locally). The conversion layer is wired (forms → FMOS inbound `source=website`, WhatsApp → bot CTAs, book-a-meeting → Google Meet, env-gated tracking, shared-brain chatbot, SEO schema), and the P0 UX-audit cluster is fixed (booking honesty, 404, legal/DPDP grievance officer, accessibility, content), with P1 polish done (unified "Book a Strategy Call" CTA, active-nav state, branded 1200×630 OG share image, analytics consent gate, JetBrains Mono font dedupe; full next/font migration + visible breadcrumbs were owner-declined). A P2 a11y/SEO pass also landed (skip link, theme-color, nav landmark labels, reduced-motion stops, ≥44px tap targets, aria-hidden on duplicated marquee copy, reduced-motion video). Brand copy softened to "confident and plain" (combat metaphors removed). A real-device QA pass also fixed broken client-side navigation under the host-split (SiteHardNav forces full-page nav through the rewrite), the clipped footer wordmark, the mobile menu close button, the floating-WhatsApp → hero Call/WhatsApp buttons, and the FMOS app shell that was wrapping the marketing pages under clean URLs (added the clean paths to LayoutWrapper's PUBLIC_ROUTES). Ongoing design polish: green-glow hero treatment on every page, services pricing rebuilt as 3 packages from the real per-service rates, a minimal/premium mobile menu redesign, and chat-panel mobile fixes (fits above the keypad; opening it no longer auto-pops the keyboard). Remaining audit items are minor stylistic only. A markdown blog (`content/blog/*.md` → `/blog`, write-in-Claude → auto-publish; see `app/site/BLOG_HOW_TO.md`) and legacy `.html → clean` 301 redirects (for the domain migration) are also in place. **See `app/site/README.md` — the canonical marketing-site handoff.** Tracking (Meta Pixel + GA4 + Microsoft Clarity) is env-gated and inert until the IDs are set.

- **Data layer** — `lib/lp/niches.ts` (per-niche registry + `enabled` gate, EN/KN copy, competitors, upsell path), `lib/lp/data.ts` (merges the registry with the live `market_insights` row — the same record that powers the report PDFs — and computes the labelled projection), `lib/lp/copy.ts` (EN/KN section copy).
- **Page + UI** — `app/lp/[niche]/[city]/page.tsx` (server-rendered, SEO + JSON-LD) and `components/lp/` (`book-cta` lead form + Google Meet slot picker, `lang-toggle`, `reveal` scroll animations, `lp-analytics`).
- **Lead capture** — `actions/lp-book.ts` runs the public inbound pipeline (`processInboundLead`) and, on a chosen slot, calls `bookMeeting`; **Book a meeting** is the primary CTA, **WhatsApp** (→ bot WABA number, source-tagged) the secondary. No fabricated results — proof is shown on request only.
- **Seed** — `supabase/2026-06-17_lp_market_insights_hubli_dental.sql` seeds the Dental Clinics · Hubli `market_insights` row (idempotent).

The auth gate lives in `proxy.ts` (Next 16's renamed middleware) and is intentionally
**fail-open** — read the notes in that file before touching it. Public LP routes (`/lp/*`) bypass the gate by design.
