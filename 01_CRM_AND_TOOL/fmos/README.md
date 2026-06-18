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
- **`scripts/setup_whatsapp_flows.mjs`** — one-time: creates + publishes the multi-select "Services" WhatsApp **Flows** (EN/KN/HI checkbox forms) on the WABA and prints their ids for the `WHATSAPP_FLOW_ID_*` env vars. Reads `WHATSAPP_API_TOKEN` from `.env.local`; the flows are self-contained (no endpoint/encryption — completion returns via `nfm_reply`).

The telecaller cockpit (`components/sales/telecaller-cockpit.tsx`) logs call outcomes and, on **"Interested — Book Meeting Now"** with a chosen date/time, creates a Google Calendar/Meet booking (`bookMeeting`); every other outcome (and a "book" logged without a time) auto-sends the mapped WhatsApp template instead (3.2 / 3.4).

## WhatsApp sending & the send-mode safety guard

**Current status (2026-06-18):** all outbound WhatsApp goes through `lib/whatsapp/send.ts` (the only module that touches the Graph API). Every send funnels through the `preflight()` choke-point (opt-out + active-inbound suppression + daily-cap/per-minute throttle), and **every** send function — `sendWhatsAppText`, `sendWhatsAppButtons`, `sendWhatsAppDocument`, and `sendWhatsAppTemplate` — now honors the send-mode guard.

- When `WHATSAPP_SEND_MODE=test`, `resolveRecipients()` redirects **all** recipients to `WHATSAPP_TEST_RECIPIENTS`, so no real lead/client number can be messaged from a test run (logged as `[TEST→<realPhone>]`). When the var is absent or `live`, sends go to the real number. Previously only template sends were redirected; the text/buttons/document paths (e.g. the AI bot's booking confirmation in `lib/bot/engine.ts`) are now covered too.
- The same guard applies to the meeting-booking flow end-to-end: `bookMeeting`'s admin alert, the client-facing `meeting_confirmation`, reschedule/no-show confirmations, and the `meeting_reminder_1h`/`_15m` reminders fired by the `scheduled-messages` cron all route through these guarded functions.

**Pre-launch safety audit (2026-06-19):** an adversarial code audit confirmed **no real client can be messaged while `WHATSAPP_LAUNCH` ≠ "1"** (the `filterAllowlist` guard, run against all live lead numbers, drops every non-QA number; it fails *closed*). Launch-hardening fixes from the audit: `resolveRecipients` now **fails closed** when `WHATSAPP_SEND_MODE=test` but `WHATSAPP_TEST_RECIPIENTS` is empty (drops instead of hitting the real number); the `scheduled_messages` poison pill is fixed (`outcome-handler.ts` stores `params` as a real jsonb array; the cron parses defensively and wraps each row in try/catch so one bad row can't abort the batch); `invoice-reminders` only flips an invoice to `overdue` when the reminder actually sent; and the **repo-root** `.github/workflows/cron.yml` (the one GitHub actually runs) now also pings `scheduled-messages` + `whatsapp-quality` (every 15 min) and `invoice-reminders` (daily). **Before opening bulk sends:** set `WHATSAPP_DAILY_CAP` to the real WABA tier (~250), verify every `ADMIN_WHATSAPP_NUMBERS` entry is owned, and stage the rollout (canary allowlist → small batches → full `WHATSAPP_LAUNCH=1`).

## Guided multilingual WhatsApp bot (EN / Kannada / Hindi)

**Current status (2026-06-19):** the WhatsApp bot now leads with a **tap-driven, multilingual menu** so non-English speakers can navigate without typing. Built and verified (`tsc` 0 + production build) behind the launch allowlist — still locked to the QA numbers until `WHATSAPP_LAUNCH=1`.

- **Menu engine** — `lib/bot/menu.ts`: first contact (and a "hi"/"menu" trigger) sends a **language picker** (English · ಕನ್ನಡ · हिंदी); the choice is stored on `leads.wa_lang` (new nullable column). Picking a language opens a **services list menu** (get-more-customers, GMB, website, ads, SEO, WhatsApp marketing, see-results, plus **Book a free call** and **Talk to a person**) with copy + the locked KB pricing in that language. Navigation is **stateless** — every button/list-row id is self-describing (`m:*`) and routed by `handleMenuTap()`. **Book a free call** offers tappable IST time slots (`m:slot:<iso>` → `bookMeeting`); **Talk to a person** pauses the bot (`bot_paused`) and alerts the team.
- **List sender** — `lib/whatsapp/send.ts` gains `sendWhatsAppList()` (interactive list menu, ≤10 rows) with the same `preflight()` / `resolveRecipients()` / allowlist guards as the other send functions.
- **Multi-select services (WhatsApp Flow)** — after the language pick the bot opens a **checkbox Flow** (`sendWhatsAppFlow()` in `send.ts`; `sendServicesFlow()` in `menu.ts`) so a lead can tick **multiple** services at once (WhatsApp lists/buttons are single-select; only a Flow gives true checkboxes). The 3 published flows (EN/KN/HI) are referenced by `WHATSAPP_FLOW_ID_EN` / `_KN` / `_HI` env vars — **when an id is missing the bot falls back to the single-select list menu**, so this is safe to ship before the flows exist. On completion the webhook receives an `nfm_reply`, and `handleServicesFlowResponse()` tags the chosen services on the lead (`wants_<svc>` + `wa_services_selected`, logged to `activity_events`) and replies in-language with a Book-a-call / Talk-to-a-person next step. The flows are created + published by the one-time setup script (below).
- **Discovery + personalization** — after the language pick the bot runs a 2-question discovery (`startDiscovery` / `handleDiscoveryReply` in `menu.ts`): business **name** (`leads.company_name`) then **what they do** (`leads.wa_about`), tracked by `leads.wa_stage` (`await_name` → `await_about` → `done`). It's skip-friendly — if the lead asks a question instead of answering, discovery is abandoned and the message continues to the AI. The captured business is threaded into every AI reply (`BotBusiness` → `engagementInstruction` in `engine.ts`) so answers are tailored to that specific business, never generic.
- **Engage-first, not booking-first** — after the services Flow the bot no longer dead-ends into book/talk buttons; `handleServicesFlowResponse` now sends a **personalized, in-language explanation of each chosen service** via `generateServicesExplainer()` and invites more questions. Booking and human-handoff stay reachable by typing (booking-intent detection / escalation). The AI is instructed to educate and only invite a call once the lead is warm.
- **AI fallback, in-language** — `lib/bot/engine.ts`: free-text still goes to the AI (`generateBotReply` / `runBot`), which now **replies in the lead's `wa_lang`** (or mirrors the language the customer wrote in, incl. Kanglish). The static KB system prompt is sent with **Anthropic prompt caching** to cut reply latency + cost.
- **Webhook wiring** — `app/api/webhooks/whatsapp/route.ts`: the new-lead auto-greeting is the language picker; interactive `m:*` taps (button **and** list replies) route to the menu engine; `wa_lang` is passed into `runBot`.

## Public site & niche landing pages (Stage 2.1)

**Current status (2026-06-18):** the data-driven niche landing page **Dental Clinics · Hubli** (`/lp/dental-clinics/hubli`, EN + Kannada via `?lang=kn`) is built and verified; per the launch gate only this niche is enabled, other niches pending. The **fortunemarq.com marketing site (5.1) is now fully built** under `app/site/*` (Home / About / Services / Work / Contact / Privacy / Terms + a branded 404), served at clean root paths via a host-split in `proxy.ts` (marketing host → `/site/*`; FMOS app sealed on its own host; `MARKETING_PREVIEW_LOCAL=1` to preview clean URLs locally). The conversion layer is wired (forms → FMOS inbound `source=website`, WhatsApp → bot CTAs, book-a-meeting → Google Meet, env-gated tracking, shared-brain chatbot, SEO schema), and the P0 UX-audit cluster is fixed (booking honesty, 404, legal/DPDP grievance officer, accessibility, content), with P1 polish done (unified "Book a Strategy Call" CTA, active-nav state, branded 1200×630 OG share image, analytics consent gate, JetBrains Mono font dedupe; full next/font migration + visible breadcrumbs were owner-declined). A P2 a11y/SEO pass also landed (skip link, theme-color, nav landmark labels, reduced-motion stops, ≥44px tap targets, aria-hidden on duplicated marquee copy, reduced-motion video). Brand copy softened to "confident and plain" (combat metaphors removed). A real-device QA pass also fixed broken client-side navigation under the host-split (SiteHardNav forces full-page nav through the rewrite), the clipped footer wordmark, the mobile menu close button, the floating-WhatsApp → hero Call/WhatsApp buttons, and the FMOS app shell that was wrapping the marketing pages under clean URLs (added the clean paths to LayoutWrapper's PUBLIC_ROUTES). Ongoing design polish: green-glow hero treatment on every page, services pricing rebuilt as 3 packages from the real per-service rates, a minimal/premium mobile menu redesign, and chat-panel mobile fixes (fits above the keypad; opening it no longer auto-pops the keyboard). Remaining audit items are minor stylistic only. A markdown blog (`content/blog/*.md` → `/blog`, write-in-Claude → auto-publish; see `app/site/BLOG_HOW_TO.md`) and legacy `.html → clean` 301 redirects (for the domain migration) are also in place. **See `app/site/README.md` — the canonical marketing-site handoff.** Tracking (Meta Pixel + GA4 + Microsoft Clarity) is env-gated and inert until the IDs are set.

- **Data layer** — `lib/lp/niches.ts` (per-niche registry + `enabled` gate, EN/KN copy, competitors, upsell path), `lib/lp/data.ts` (merges the registry with the live `market_insights` row — the same record that powers the report PDFs — and computes the labelled projection), `lib/lp/copy.ts` (EN/KN section copy).
- **Page + UI** — `app/lp/[niche]/[city]/page.tsx` (server-rendered, SEO + JSON-LD) and `components/lp/` (`book-cta` lead form + Google Meet slot picker, `lang-toggle`, `reveal` scroll animations, `lp-analytics`).
- **Lead capture** — `actions/lp-book.ts` runs the public inbound pipeline (`processInboundLead`) and, on a chosen slot, calls `bookMeeting`; **Book a meeting** is the primary CTA, **WhatsApp** (→ bot WABA number, source-tagged) the secondary. No fabricated results — proof is shown on request only.
- **Seed** — `supabase/2026-06-17_lp_market_insights_hubli_dental.sql` seeds the Dental Clinics · Hubli `market_insights` row (idempotent).

The auth gate lives in `proxy.ts` (Next 16's renamed middleware) and is intentionally
**fail-open** — read the notes in that file before touching it. Public LP routes (`/lp/*`) bypass the gate by design.
