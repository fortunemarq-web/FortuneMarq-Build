# Marketing site rebuild (`fortunemarq.com`) — handoff

**Status (2026-06-18):** ALL PAGES DONE + verified (desktop + mobile, `tsc` 0, clean console).
Home, About, Services, Work, Contact, Privacy, Terms are built; robots.txt + sitemap.xml added;
Contact form wired → FMOS inbound (`source=website`); site-wide advanced-motion pass applied.
This is the canonical handoff for the public marketing-site rebuild. Read it fully before continuing.

## What this is
A from-scratch re-platform of the existing static `fortunemarq.com` into this Next.js app — **same design, faster, smoother, SEO-first**, with a premium scroll feel. It is a **parallel rebuild**: the live Hostinger site is untouched.

- **Staged route:** everything lives under **`/site`** (e.g. `/site`, `/site/about`). Public — added to `PUBLIC_PREFIXES` in `proxy.ts` and `PUBLIC_ROUTES` in `components/ui/layout-wrapper.tsx` (no auth, no app chrome).
- **Final root (`/`) mapping is a deferred decision** (host-split: `fortunemarq.com` → marketing, `fmos.fortunemarq.com` → app). Don't repoint `/` yet.
- **Source of truth for design/content:** `05_FORTUNEMARQ_ONLINE_PRESENCE/public_html/` — `index/about/services/work/contact/privacy-policy/terms-of-service .html` + `style.css` (5,499 lines) + `script.js` (1,474 lines) + `assets/`. Look: `#030303` bg, `#42CA80` green, Alliance No1/No2 + JetBrains Mono, GSAP + ScrollTrigger + Lenis motion.

## Files (all created for this rebuild)
| File | Role |
|---|---|
| `app/site/site.css` | The original `style.css` **verbatim** (only the 3 `@font-face` paths repointed to `/site/fonts/`) + appended blocks: Next integration body surface, **mobile-light perf overrides**, **minimal preloader**, **results-mobile-pinnable**, **premium footer**. The CSS for About / Services / Contact / Creative-Journal is ALREADY here (verbatim from the original) — those pages just need their JSX + motion. |
| `app/site/layout.tsx` | Loads `site.css`; fonts (Google Inter+JetBrains via `<link>` swap, Alliance self-hosted + preloaded); composes chrome + `<SiteMotion/>`. |
| `app/site/page.tsx` | HOME page — all sections + premium footer, `next/image`, mp4 videos + posters, SEO metadata + Organization JSON-LD. |
| `components/site/site-chrome.tsx` | Static chrome: **minimal preloader**, header, mobile menu, lightbox, scroll indicator. Exports `SITE_NAV`. |
| `components/site/site-motion.tsx` | **Client GSAP engine** (one `useEffect` + `gsap.context` + full cleanup). Lenis is **desktop-only** (`min-width:992 + hover:hover + pointer:fine`); touch = native momentum scroll. `prefers-reduced-motion` fully respected. `ScrollTrigger.config({ ignoreMobileResize:true })`. |
| `components/site/site-contact-form.tsx` | Home contact form — **wired → FMOS inbound** (`source=website`) via `captureWebsiteLead`. Added required **phone** field (email optional, message → lead note); client + server validation, success/error states. (Conversion layer Task 1.) |
| `public/site/images/*` | All 27 webp (logos, partner/cert badges, service + result + journal images). |
| `public/site/videos/*` | Project clips: optimized **`.mp4`** (H.264, ~74% smaller than the webm) + `.webm` fallback + `posters/*.jpg`. |
| `app/site/fonts/*` + `public/site/fonts/*` | Alliance No1/No2 (otf) + JetBrains Mono (woff2). |
| `next.config.ts` | Added `allowedDevOrigins` (Tailscale IP + LAN) so the dev server renders on a phone. |

## Content honesty (2026-06-18)
Home **testimonials were fabricated** in the source port (fake names/quotes) → **replaced with honest "principle" cards** (Market Exclusivity, Strategy Over Budget, Radical Transparency, Education, Data-First, Built to Convert) in the same marquee. Swap in real testimonials later via the `PRINCIPLES_LEFT/RIGHT` arrays in `app/site/page.tsx`. **Results dashboards are REAL (owner-confirmed) — left untouched.** The about-section stat band (50+/4×/₹12M+/97%) was NOT changed — confirm those numbers before go-live.

## DONE — Home page
Cinematic minimal preloader → hero (animated CSS globe + mouse parallax) → mission **word-by-word scroll-scrub** (grey→white, accent→green; all devices, smooth) → "Strategy / Exclusivity" + stat count-up → **Core Offerings** (desktop horizontal **pin-scrub**, mobile stacked) → Featured Projects (lazy mp4 videos, play-in-view) → **"Simplified Growth" Results** (sticky + auto horizontal scroll **on all devices**) → Creative Journal (auto-loop, paused offscreen) → Testimonials marquees → Contact → **premium footer** (CTA, 3 columns, giant ghost wordmark). Certificate cards do a 3D "deal-in" reveal.

## Performance work (done — keep these invariants)
Lenis desktop-only · `mix-blend-mode` full-screen grain removed · mobile strips heavy blur/backdrop-filter/noise · `next/image` everywhere · videos re-encoded to mp4 + posters · route code-split · preloader plays **once per session** (`sessionStorage 'fmq_preloaded'`). Mobile must stay native-smooth — avoid heavy scrubbed effects on touch, or test them.

## DONE — all pages (2026-06-18)
Every page is built, ported faithfully, polished, and verified (desktop 1440 + mobile 390, `tsc` 0, clean console):
- **`/site/about`** ← `about.html` (`.abt-*`; motion `initAboutPage`, ported from `initNewAboutPage`). Story image self-hosted at `public/site/images/about-origin.jpg`; image parallax + magnetic CTAs.
- **`/site/services`** ← `services.html` (`.sp-*` + `.c-svc-*`; motion `initServicesPage` = ported `initCinematicServices` pinned clip-wipe showcase + `initServicesAnimations` process/pricing + interactive accordion). 4 showcase images self-hosted (`svc-web/performance/seo/crm.jpg`).
- **`/site/work`** — `work.html` was **empty (0 bytes)**, so this is a **composed** portfolio page: new `.wk-*` hero/stat band (CSS appended to `site.css`) + the home's `.fp-*` project grid (lazy play-in-view mp4 videos via the shared `#featured-projects` init). Motion `initWorkPage`.
- **`/site/contact`** ← `contact.html` (`.ct-*`; motion `initContactPage` minus submit). **Form wired → FMOS inbound** via `captureWebsiteLead` (channel `website`) in `lib/automations/inbound-leads.ts` → `processInboundLead`. Added a **phone field** (FMOS is phone-first); budget/services/message fold into the lead note. Client + server validation, success/error states; focus micro-interactions kept.
- **`/site/privacy-policy`** + **`/site/terms-of-service`** — clean readable legal layout (new `.lg-*` CSS) via the shared `components/site/site-legal.tsx` (content as structured data per page).
- **`app/robots.ts`** + **`app/sitemap.ts`** (Next metadata routes) — real domain, marketing URLs match each page's canonical (root-domain paths, per the deferred host-split); app/admin/api routes disallowed.

### Shared building blocks added this round
- `components/site/site-footer.tsx` — the premium footer, extracted from home and reused on every page (home refactored to use it; markup identical).
- `components/site/site-legal.tsx` — legal prose layout. `components/site/site-contact-page-form.tsx` — the wired contact form.
- New CSS appended to `site.css`: `.wk-*` (Work), `.lg-*` (legal), `.ct-form-error/.ct-form-success` (form status), `.shiny-text`.
- `components/site/shiny-text.tsx` — React Bits **ShinyText** ported to TS (dep: `motion`). A sweeping sheen on the eyebrow/kicker labels (brand green `#42CA80` base, white shine, slow `speed=4` `delay=1`). Used as a consistent signature on every page's hero kicker + the shared footer eyebrow. Wrapped *inside* the existing label spans, so all classes/attributes/GSAP targeting are preserved. Forces static base colour under `prefers-reduced-motion`.
- `components/site/rotating-text.tsx` — React Bits **RotatingText** ported to TS (dep: `motion`). Featured in the **home hero headline**: "Compete With …" rotates `Industry Giants. → Market Leaders. → Bigger Budgets. → The Old Guard.` (spring, stagger-from-last, 2.6s). First item = `Industry Giants.` so SSR + reduced-motion match the original. Styled via `.vh-rotate` (italic + brand accent, matches `.italic-accent`; `nowrap` so phrases never wrap / shift the hero). `.vh-title` is not GSAP-animated, so no conflict. Reduced-motion → static first word, no rotation.

## Conversion layer (CONVERSION_LAYER_BUILD.md)
- **Task 1 — home contact form wired** → `captureWebsiteLead` (source=website), phone field added. ✅
- **Task 2 — WhatsApp → bot CTAs** ✅ `components/site/site-whatsapp.tsx`: `waBotLink(source, msg?)` → `wa.me/${NEXT_PUBLIC_WA_BOT_NUMBER|917975918980}` with a source-tagged prefilled message; `<WhatsAppCta>` (header icon `.header-wa` desktop, hero `.vh-btn-wa`, contact `.ct-wa-btn`, footer `.fm-footer-wa`) + `<FloatingWhatsApp>` (bottom-left FAB, brand-green, pulse, hidden when menu open; reduced-motion → no pulse). Every click fires `trackEvent("whatsapp_click", {source})`.
- **Task 3 — book-a-meeting + Google Meet** ✅ (code) `actions/site-book.ts` (`requestSiteCall` + `bookSiteMeeting`, channel "website") mirrors `lp-book.ts` → `processInboundLead` → `bookMeeting`. `components/site/site-book-cta.tsx` (`.sbk-*` styling): lead form + 6 upcoming-slot picker + WhatsApp fallback + tracking; on Contact page (`#book`) + home hero primary CTA "Book a Strategy Call" → `/site/contact#book`. Live test booked a REAL Google Meet (works). ✅ **Dedup false-merge FIXED 2026-06-18** — root cause was `processInboundLead` deriving the dedup *domain* from `referrer_url`/`landing_page` (the visitor's context = our own site / `localhost`, and a path-only landing page like `/site/contact` even resolved to host `"site"` → `website_link ilike %site%` matched almost everything). Fix: auto-merge now only on **phone (last-10)** then **exact email**; the referrer/landing domain match was removed (fuzzy company matching deferred to the human `/admin/leads/duplicates` tool); `phone_normalized`/`email_normalized` now populated on insert. Safe to enable live website booking.
- **Task 4 — analytics MOUNTED + wired** ✅ `components/site/site-analytics.tsx` (GA4 + Meta Pixel + Clarity, env-gated/inert) now rendered in `app/site/layout.tsx`, so the trackers inject when `NEXT_PUBLIC_GA4_ID`/`NEXT_PUBLIC_META_PIXEL_ID`/`NEXT_PUBLIC_CLARITY_ID` are set and make ZERO network calls otherwise. `trackEvent(name, props)` fires: `lead_submitted` (home form `source:home-contact`, contact-page form `source:contact-page`, book-cta `source:site-book`), `whatsapp_click` (every WhatsApp CTA + FAB), `meeting_booked` (book-cta). Inert/no-throw when no tracker loaded.
- **Task 6 — SEO structured data** ✅ `lib/site/seo.ts` (builders, single canonical `LocalBusiness` `@id` so no duplicate Organization) + `components/site/json-ld.tsx` (server `<JsonLd>`). Per page: **LocalBusiness** (NAP + geo + Mo–Sa hours + sameAs) on home + contact; **Service** ×4 on /services; **FAQPage** on /contact (4 Qs) and /services (3-item accordion); **BreadcrumbList** on about/services/work/contact/privacy-policy/terms-of-service. Home's old inline Organization JSON-LD replaced by LocalBusiness. `sitemap.ts`/`robots.ts` already cover all routes.

### Advanced-motion pass (Task B) — all in `site-motion.tsx`, reduced-motion respected
- **Engine re-inits per route**: the effect is now keyed on `usePathname()` (the layout/engine stays mounted across soft navigation, so without this per-page motion wouldn't fire). Full teardown (revert ctx, destroy Lenis, drop listeners) → rebuild on each navigation.
- **Magnetic CTAs** (`initMagneticCTAs`, desktop) — `[data-magnetic]` + site CTAs (`.header-cta`, `.fm-footer-cta-btn`, `.vh-btn-main`, `.fp-cta`, `.mm-cta-btn`).
- **Image parallax** (`initParallax`) — `[data-parallax]` (oversized image inside overflow-hidden → no gaps).
- **Page-enter transition** (`initPageEnter`) — soft container fade per route (container-level, never fights hero entrances).
- **Smooth in-page anchors** (`initSmoothAnchors`) — Lenis on desktop, native `scrollIntoView` fallback on touch.

### Minor-motion pass (site-wide micro-interactions)
- **Card spotlight** (`initCardSpotlight`, desktop) — a brand-green glow that follows the cursor across card surfaces site-wide (`.sp-pricing-card, .ct-faq-item, .ct-info-card, .abt-pillar, .abt-metric-card, .sp-step, .fp-card`). Injects a real `.card-spotlight` overlay child per card (no pseudo-element clashes), tracks the pointer via `--mx/--my` (rAF-throttled), removed on teardown. Desktop-only → off for touch + reduced-motion.
- **Link underline sweep** (CSS) — animated accent underline grows from the left on `.header-nav a` (+ `.active`) and `.fm-footer-col a` (footer-min-link already had its own). Disabled under `prefers-reduced-motion`.
- **Count-up** (CSS `.wk-count` + `initWorkPage`) — the Work hero stats count to their value on scroll (`50+`, `4.1x`, `97%`, `<2s`; decimals + prefix/suffix preserved). Reduced-motion → final values immediately.

### Mobile + home-page motion pass
- **Touch press feedback** (CSS, `@media (hover: none) and (pointer: coarse)`) — buttons/CTAs spring on `:active` (scale 0.95), cards flash an accent border. Touch-only, so desktop hover is untouched; `-webkit-tap-highlight-color` cleared.
- **Home hero scroll-parallax** (`initHeroParallax`, all devices) — the globe, caption, hero content + auroras drift at different rates as the hero leaves (cheap scrubbed transforms; auroras are display:none on mobile so there it's the sphere + content). Content sits at full opacity at the top; depth only engages on scroll. Reduced-motion → off.
- **Mobile Core Offerings reveal** (`initMobileStack`) — the desktop horizontal pin doesn't run on touch, so the stacked `.fm-stack-card`s get their own rise+settle scroll entrance. Self-gates on `offsetParent` (no-op when the section is display:none on desktop). Reduced-motion → off.

### Open / nice-to-have (not blocking)
- Contact form was **not** submitted against the live CRM during verification (avoids creating a real lead + notifying the team). Do one real test submission before launch.
- `text scramble` reveal was intentionally skipped (the SplitType line/clip reveals already read premium; scramble risked noise). Revisit if desired.

### How to wire per-page motion
`site-motion.tsx` currently inits the home set + shared chrome. For new pages, **extend `site-motion.tsx`** with each page's init functions, **gated by a presence selector** (e.g. `if (document.querySelector('.abt-hero')) initAboutPage()`), exactly like the original `script.js` did — and make sure each is added to the `gsap.context` and cleaned up. Re-init on route change if needed (the effect is `[]`-deps today; home-only). Read the real init code from `05_FORTUNEMARQ_ONLINE_PRESENCE/public_html/script.js`.

## Run / verify
```bash
cd 01_CRM_AND_TOOL/fmos && npm run dev   # binds 0.0.0.0
```
Desktop: `http://localhost:3000/site`. Phone (Tailscale): `http://100.114.160.47:3000/site`.
Always: `npx tsc --noEmit` = 0, check console clean, verify **desktop AND mobile** (mobile = native scroll, no Lenis). Don't touch the live Hostinger site.
