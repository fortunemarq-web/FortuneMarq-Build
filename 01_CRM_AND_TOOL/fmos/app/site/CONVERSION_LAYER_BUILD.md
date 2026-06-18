# Marketing site — conversion layer build spec

**Read `app/site/README.md` first** (architecture, files, perf invariants). This file is the build
plan to make the already-built marketing site at `/site` actually **collect leads, book meetings,
talk to visitors, and track conversions** — the plumbing the pages currently lack.

## Current state (audited 2026-06-18) — what's MISSING
The 7 pages are built/verified, but the conversion layer is mostly absent on the main site:
- **Home contact form is a no-op** — `components/site/site-contact-form.tsx` just `preventDefault`s (TODO). Submissions are lost. (The **Contact page** form `components/site/site-contact-page-form.tsx` IS wired — use it as the reference.)
- **No WhatsApp CTA anywhere** on the site (only `tel:`/email). The design wants a WhatsApp → bot CTA.
- **No book-a-meeting / Google Meet** on the site (the niche LP has it; the site doesn't).
- **No website chatbot.**
- **No analytics** (Meta Pixel / GA4 / Clarity) on the site.
- **SEO**: only foundations (per-page metadata, canonical, OG/Twitter, `app/robots.ts`, `app/sitemap.ts`, Organization JSON-LD on home). No LocalBusiness/Service/FAQ/Breadcrumb schema; no organic program (that's Stage 5.3, future).

**Almost everything needed already exists** — reuse it, don't rebuild.

## Reusable building blocks (exact signatures)
- **Inbound capture (returns leadId):** `processInboundLead(input)` in `lib/inbound/capture.ts` → `{ success, status, leadId? }`. Use `channel: "website"`.
- **Form-only capture (no leadId):** `captureWebsiteLead({ name, email, phone, company?, budget?, services?, message?, landing_page?, referrer_url? })` in `lib/automations/inbound-leads.ts` → `{ success, message? }`. Used by the wired Contact-page form.
- **Booking (Google Calendar + Meet):** `bookMeeting({ leadId, startIso, lang? })` in `actions/book-meeting.ts` → `{ ok, meetLink?, calendarLink?, error? }`. Creates the event, writes `meeting_link` to the lead, sends confirmation + reminders.
- **AI bot:** `runBot({ leadId, phone, userText, channel?, waMessageId? })` in `lib/bot/engine.ts` → `{ handled, reply?, skipped?, escalationTrigger? }`. **WhatsApp-coupled** (sends the reply via the phone). KB source: `00_MASTER/Bot_Knowledge_Base/` → `lib/bot/kb.ts`. Guardrails: no pricing outside packages, no guarantees, escalate on complaints/price-negotiation/off-script, `leads.bot_paused` takeover, opt-out. Bot is **test-mode gated** (only replies to test numbers until live) and all sends respect `WHATSAPP_SEND_MODE`.
- **LP reference implementations to MIRROR:**
  - `actions/lp-book.ts` → `requestLpCall(form)` + `bookLpMeeting(form, startIso)` (capture → bookMeeting). Make a `website` equivalent.
  - `components/lp/book-cta.tsx` → form + time-slot picker + WhatsApp button + tracking. Adapt for the site.
  - `components/lp/lp-analytics.tsx` → `<LpAnalytics/>` + `trackLpEvent(name, props)`; env: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID`. Generalize for the site.
- **WhatsApp inbound webhook:** `app/api/webhooks/whatsapp/route.ts` (CTWA attribution + `runBot`). Inbound channels: `app/api/inbound/[channel]/route.ts`.
- **Numbers:** WABA **bot** number `917975918980` (env `NEXT_PUBLIC_WA_BOT_NUMBER`, default this) — WhatsApp CTAs that should hit the bot use THIS. Display number `919353082656`. Email `contact@fortunemarq.com`.

## Build tasks (do in order; verify + screenshot each on desktop + mobile)

### 1. Wire the home contact form → FMOS inbound
`components/site/site-contact-form.tsx`: replace the no-op with a real submit mirroring `site-contact-page-form.tsx`. **Add a phone field** (FMOS is phone-first) — keep name + phone required, email optional, message → lead note. Use `captureWebsiteLead` (or `processInboundLead({channel:"website"})`). Client + server validation, success/error states, keep the existing styling/focus micro-interactions. **Acceptance:** a submit creates a `source=website` lead (test ONCE — the pipeline dedups; don't spam prod).

### 2. WhatsApp → bot CTAs site-wide
Add a small reusable WhatsApp CTA (`wa.me/${NEXT_PUBLIC_WA_BOT_NUMBER}?text=<prefilled, source-tagged>`) in: the header chip (secondary), the home hero (secondary action), the Contact page, the footer, and a **floating WhatsApp button** (esp. mobile). The prefilled text carries a source tag the bot/capture can read (mirror the LP's `waText`). **Acceptance:** every link resolves to the bot number; a `whatsapp_click` tracking event fires (task 4).

### 3. Book-a-meeting + Google Meet on the site
- New `actions/site-book.ts` mirroring `actions/lp-book.ts` but `channel: "website"`: `bookSiteMeeting(form, startIso)` → `processInboundLead` (get `leadId`) → `bookMeeting({ leadId, startIso })` → return `{ success, meetLink }`.
- New `components/site/site-book-cta.tsx` adapted from `components/lp/book-cta.tsx` (lead form + upcoming-slot picker + WhatsApp + tracking). Put it on the Contact page and wire a **"Book a meeting" primary CTA** in the hero/header to it (modal or `/site/contact#book`).
- **Acceptance:** picking a slot books a REAL Google Meet (the action writes the event + `meeting_link`); confirmation shown. Test once.

### 4. Tracking (Meta Pixel + GA4 + Microsoft Clarity)
Generalize `components/lp/lp-analytics.tsx` into a shared `components/site/site-analytics.tsx` (or reuse it) mounted in `app/site/layout.tsx`. Export `trackEvent(name, props)`. Fire events on: form submit (`lead_submitted`), WhatsApp click (`whatsapp_click`), booking (`meeting_booked`), key CTA clicks. **Env-gated** — fully inert until `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_CLARITY_ID` are set. **Acceptance:** no network calls without env; fires when set.

### 5. Website chatbot (same brain as the WhatsApp bot)
- `runBot` is WhatsApp-coupled. **Refactor** `lib/bot/engine.ts` to expose a shared reply generator (KB + guardrails + Anthropic) that both WhatsApp and web use — web returns text to the browser, does NOT send WhatsApp. Keep ALL guardrails/escalation identical.
- `app/api/webchat/route.ts` — POST `{ message, history }` → `{ reply, escalate? }`. On booking/contact intent, prompt for name + phone → `processInboundLead({channel:"website"})` → offer a **WhatsApp handoff** CTA (`wa.me` bot number) + optional book-meeting.
- `components/site/site-chat.tsx` — floating chat widget (bottom-right), on-brand, SSR-safe (client-only, lazy), respects `prefers-reduced-motion`. Mount in `app/site/layout.tsx`.
- **Acceptance:** answers from the KB within guardrails; captures a `source=website` lead; hands off to WhatsApp; no console/SSR errors.

### 6. SEO depth
Per-page JSON-LD: **LocalBusiness** (NAP + geo + hours) on home + contact; **Service** schema on services; **BreadcrumbList** on subpages; **FAQPage** where FAQs exist (contact/services) for AEO. Tighten any thin per-page titles/descriptions; confirm `sitemap.ts`/`robots.ts` cover all routes. (Defer the 5.3 programmatic city×niche pages + GSC — note as future.) **Acceptance:** valid, non-duplicated structured data per page.

## Rules / conventions (non-negotiable)
- **Reuse** the LP/bot/booking building blocks above — don't reinvent.
- `npx tsc --noEmit` must stay **0**. Verify EACH task in the preview on **desktop AND mobile**; Lenis is desktop-only (touch = native momentum scroll); respect `prefers-reduced-motion`.
- **Testing safety:** the bot is test-mode gated and sends respect `WHATSAPP_SEND_MODE` — do NOT fire real WhatsApp messages in tests; don't create junk prod leads (test once; pipeline dedups).
- Faithful design (`#030303` / `#42CA80`, Alliance No1/No2 + JetBrains Mono); reuse the shared header/footer/chrome.
- **No fabricated content** (the home testimonials were already replaced with honest principle cards — don't reintroduce fake quotes/numbers).
- Do **not** touch the live Hostinger site. Do **not** push/merge to `main`. Scoped commits on `continue-on-mac`. Update `app/site/README.md` as tasks land.
- Build + verify task 1, show me, then continue 2→6.
