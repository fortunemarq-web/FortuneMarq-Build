# Marketing site — UI/UX audit (2026-06-18)

Consolidated from a 6-dimension code review (a11y, responsive, conversion, content, SEO/perf, IA) + live visual QA on desktop (1280) and mobile (375). ~140 findings; the high-impact ones are below with `file:line` + fix. **Owner already confirmed real (NOT flagged here):** the about stat band (50+/4×/₹12M+/97%) and the "Simplified Growth" results dashboards.

**Verified solid (no layout breakage):** no horizontal overflow at any width; FABs stack cleanly bottom-left; chat panel fits mobile (351×568); pinned sections don't break layout; console clean; reduced-motion respected in JS engines; all four forms associate `<label>`/`id`.

---

## P0 — Launch blockers

**1. [DONE 2026-06-18] Routing/SEO mismatch — the whole site is mis-indexed (the deferred host-split never shipped).**
→ FIXED via host-scoped rewrite in `proxy.ts`: marketing hosts (`fortunemarq.com`/`www`, or `MARKETING_PREVIEW_LOCAL=1` locally) serve the `/site/*` pages at clean root paths and seal the app (`/admin`→site 404); FMOS app stays on its host. All internal `<Link>`s switched to clean paths; canonicals/sitemap/robots/JSON-LD already clean and now match the served URLs. Verified both hosts via Host header.
Pages are served at **`/site/*`**, but every `canonical`, `openGraph.url`, `app/sitemap.ts`, `app/robots.ts` host, and all JSON-LD/breadcrumb URLs use **bare root paths** (`/about`, `/services`…). There is **no rewrite/basePath** in `next.config.ts`, and root `/` is the **FMOS app** (`app/page.tsx` → `/login`). Net: Google is told canonicals/sitemap that 404, shared links break, and the root domain serves the CRM, not the site. *This single decision unblocks ~10 other findings.*
→ Decide the host-split: either move pages out of `/site` to bare paths, or add host-scoped `rewrites()` mapping `fortunemarq.com/* → /site/*`. Make internal links === canonicals.

**2. Booking confirmation can lie + book past slots.** `components/site/site-book-cta.tsx:84-90` + `actions/site-book.ts:83-88`: when Google Meet creation fails, `bookSiteMeeting` returns `success:true` with **no `meetLink`**, but the UI still shows "You're booked — your Google Meet is confirmed." `:73` `genSlots` runs once at mount → a stale slot can book a **past** time. No client-side validation (form is `noValidate`). `meeting_booked` analytics fires even on the degraded path (`:89`).
→ Branch on `res.meetLink` (show "request received" if absent); filter slots vs `Date.now()` at submit; add client name/phone guard; only fire `meeting_booked` when a Meet exists.

**3. Content honesty / legal-compliance risk.**
- **Partner/cert badges** ("Google Partner", "Meta Business Partner", "Shopify Partner"…) `page.tsx:43-52,270-276` — displaying these without active qualifying accounts is **false affiliation** + violates Google/Meta brand rules. Relabel "Tools we use" or remove unheld badges.
- **"TRUSTED BY LEADERS IN: E-Commerce · SaaS · FinTech…"** `page.tsx:213` and **"Avg. ROAS Delivered 4.1×"** `page.tsx:316` / `work:36` — unsupported claims (ASCI misleading-ad risk). Soften / remove.
- **Portfolio is placeholder** `page.tsx:63-71`, `work/page.tsx`: generic names, **fabricated dates**, category/name mismatches ("Agriculture" card named "Real Estate"), dead `href="#"` links; `/site/work` has zero real case-study content.
- **Legal integrity:** entity name "FortuneMarq **Media**" in legal/footer vs "FortuneMarq" everywhere else (`privacy:30`, `terms:30`, `seo.ts:13`); legal "Last Updated **January 2025**" vs "© **2026**"; no India **DPDP grievance officer**/law named (generic GDPR template); "**Founded 2020**" badge (`about:123`) contradicts the 2024 company.
→ Owner pass on all claims; fix entity name + dates; add DPDP officer; fix founding year.

**4. Accessibility blockers.**
- **No `:focus-visible` anywhere** + several `outline:none` (`site.css:1361,4831,5871,5956,5967`) → keyboard users get **zero focus indicator** site-wide (WCAG 2.4.7). One global rule fixes it.
- **Muted-text contrast fails AA:** `--muted:#888` on `#030303` ≈ 4.05:1 (need 4.5); placeholders `rgba(255,255,255,0.3)` ≈ 2.4:1. Used for nav links, body copy, mono labels.
- **Mobile menu + chat dialog:** no focus move/trap, no Escape, no `aria-expanded` (`site-chrome.tsx:53`, `site-motion.tsx:224`, `site-chat.tsx:129`).
- **Stat numbers use `<h4>`** purely for animated digits (`page.tsx:309-326`) → broken heading order / noisy outline.

**5. No 404 page.** No `app/site/not-found.tsx` (or root) → a bad `/site/*` link lands on the unstyled global Next 404 — no header/footer/theme, hard dead end.

---

## P1 — Important

**Navigation & links**
- **CTA label chaos** — one action, 6 names: "Book a Meeting" (header), "Book a Strategy Call" (hero), "Grab a 30-minute slot" (widget), "Start a conversation" (footer), "Start your project" (services/work), "Book a meeting" (chat). Pick one.
- **"Work" diverges:** header → `/site#featured-projects` (anchor) vs footer → `/site/work` (page). Same label, two targets (`site-chrome.tsx:14` vs `site-footer.tsx:14`).
- **No active nav state** — `.header-nav a.active` CSS exists (`site.css:389,5749`) but is never applied; user never sees the current page. No `aria-current`.
- **Dead links:** Twitter `href="#"` (footer; site only has LinkedIn+IG elsewhere); project-card `<a href="#">` dead ends (home + work); footer "Services" links all point to `/site/services` with no `#svc-` anchor.
- **No visible breadcrumbs** despite `breadcrumbLd()` JSON-LD on every deep page.
- **Mobile menu** lacks the WhatsApp CTA that desktop header has (WhatsApp matters most on mobile/India).

**Conversion / forms**
- **Visible `(ref: website-…)` debris** in every WhatsApp prefilled message (`site-whatsapp.tsx:13-18`) — looks like leaked tracking in a human message.
- Success message vanishes after 4s with no scroll-to / persistence → users miss confirmation; home submit button has **no `:disabled` style** (double-click risk); "Challenge" label vs "goals" placeholder; email-required inconsistent (home optional vs contact required).
- Book widget: email optional but a Meet invite needs it; "Request a call" silently downgrades intent when no slot picked.

**SEO / performance**
- **No real OG share image** — every page uses the **500×500 logo** (needs 1200×630 for `summary_large_image`); legal pages have **no OG/Twitter** at all; no layout-level OG default/`title.template`.
- **Render-blocking Google Fonts `<link>`** (`layout.tsx:28-31`) instead of `next/font`; **JetBrains Mono loaded twice** (self-host + Google); Alliance shipped as heavy `.otf` (not `.woff2`), both preloaded on every route.
- **184 KB `site.css` ships on every route** (incl. text-only legal pages) — render-blocking, no splitting.
- **Light-bg FOUC:** root `<body class="bg-slate-50">` flashes before the dark site CSS paints.
- **No consent gate** on Pixel/GA4/Clarity (`site-analytics.tsx`) — DPDP/GDPR gap + main-thread cost.
- **Stat numbers render literal `0`** in SSR/no-JS HTML → crawlers index "0+ Websites Launched".
- Missing LCP `priority` on the About origin image (1600×1068 `.jpg`, likely the LCP).

**Responsive**
- **Results "Simplified Growth" is JS-pinned on mobile** (not `isDesktop`-gated) → pin + scrub against native momentum scroll = stutter risk on low-end phones.
- **No `env(safe-area-inset-*)`** → FABs + scroll-indicator sit under the iOS home-bar / Android gesture pill.
- **Header logo 80px tall** on mobile (eats ~30% of a 390 viewport; collides with the menu chip); capabilities sticky-stack `top:100px` tucks under the taller header.
- Open **chat panel overlaps/occludes both FABs** on small screens.
- `100vh` (not `100dvh`) on pinned sections → address-bar resize jump.

**Content accuracy**
- Pricing contradiction: services "₹20,000/₹35,000" vs FAQ/form "₹25K+/₹50K+ for websites"; amounts unformatted ("₹20000"). Tool-stack drift home vs services (Klaviyo vs Zoho; "WebGL & 3D" over-claim). NAP/phone shown 4 different ways across pages (hurts local SEO).

---

## P2 — Polish (~80 items; representative)
- **Brand tone:** war/dominance metaphors ("Ready to Dominate", "war room", "military precision", "battlefield") clash with the "zero jargon, honest" positioning.
- Dual public emails (branded + personal gmail) side-by-side reads unprofessional.
- Tap targets <44px (`.header-toggle` 36px @480, chat close, social icons).
- Marquees (testimonials) + scroll-pill + badge-blink still animate under `prefers-reduced-motion` (only globe/auroras are stopped).
- Decorative duplicated marquee/ticker text read twice by screen readers (no `aria-hidden` on the loop copy).
- Chat: no conversation persistence (wiped on close/route change); "…" typing indicator is static text; IST-only slots with no local-time hint.
- `keywords` meta (dead since 2009); no `theme-color`/favicon set/GSC verification; hardcoded OG `url` per page; "Hidden Fees: 0" animated stat; "Creative Journal / our visual work" over stock images; SVC/HUD jargon labels ("SYSTEM // CAPABILITIES", "TRANSMISSION // OPEN").
- Decorative glyphs (→ ✓ + ● ✕) and looping project `<video>`s not `aria-hidden`; project videos autoplay even under reduced-motion.
- No skip-to-content link; multiple unlabeled `<nav>` landmarks.

---

### The 5 highest-leverage fixes
1. **Host-split decision** (P0-1) — unblocks all canonical/sitemap/OG/breadcrumb/root issues at once.
2. **Booking-confirmation truthfulness + past-slot guard** (P0-2).
3. **Owner pass on claims/badges + legal entity/date/DPDP** (P0-3).
4. **One global `:focus-visible` + `--muted` contrast bump** (P0-4) — clears dozens of a11y failures in two CSS edits.
5. **Unify the CTA label + kill all `href="#"` dead links + active nav state** (P1).
