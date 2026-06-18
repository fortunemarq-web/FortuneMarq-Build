# Website Changes — how to safely edit the FortuneMarq site

You're here to change something on the public website (text, image, link, section, price, or a
tracking/marketing code). The owner is not technical — do the work and explain it plainly.

**First read** `01_CRM_AND_TOOL/fmos/app/site/README.md` for the full architecture, then follow this.
All commands run from `01_CRM_AND_TOOL/fmos`.

## Where things are (✅ safe to edit)
The whole public site is under `01_CRM_AND_TOOL/fmos/app/site` and `01_CRM_AND_TOOL/fmos/components/site`.

- **Home page** — `01_CRM_AND_TOOL/fmos/app/site/page.tsx`
- **Other pages** — `01_CRM_AND_TOOL/fmos/app/site/about/page.tsx`, and the same pattern for
  `services`, `work`, `contact`, `privacy-policy`, `terms-of-service`, `blog`.
- **Header / menu** — `01_CRM_AND_TOOL/fmos/components/site/site-chrome.tsx`
- **Footer** — `01_CRM_AND_TOOL/fmos/components/site/site-footer.tsx`
- **All styling** — `01_CRM_AND_TOOL/fmos/app/site/site.css`
- **Tracking (GA4 / Meta Pixel / Clarity)** — `01_CRM_AND_TOOL/fmos/components/site/site-analytics.tsx`
- **SEO** — `01_CRM_AND_TOOL/fmos/lib/site/seo.ts`, `01_CRM_AND_TOOL/fmos/app/sitemap.ts`, `01_CRM_AND_TOOL/fmos/app/robots.ts`
- **Service packages / prices** — the `PRICING` block in `01_CRM_AND_TOOL/fmos/app/site/services/page.tsx`

## Common jobs
- **Change wording / a headline** → edit the text in that page's `.tsx` file. Keep the brand tone.
- **Change / add a link or button** → edit the relevant page or `site-chrome.tsx` / `site-footer.tsx`.
- **Change a price or package** → edit `PRICING` in `01_CRM_AND_TOOL/fmos/app/site/services/page.tsx`.
  Prices are real — confirm the numbers with the owner first.
- **Add a tracking / marketing pixel or script** (LinkedIn, TikTok, a new conversion tag, GTM, etc.):
  - The 3 built-in ones (GA4, Meta Pixel, Microsoft Clarity) are already wired — to switch them on you
    just set their ID as an environment variable in Vercel (`NEXT_PUBLIC_GA4_ID`,
    `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID`). No code change needed.
  - For ANY OTHER pixel/script, add it inside `01_CRM_AND_TOOL/fmos/components/site/site-analytics.tsx`,
    following the same pattern (loaded via next/script, env-gated, and **after the consent gate** so it
    respects the DPDP cookie banner). Never paste raw `<script>` tags into a page.

## 🚫 DO NOT TOUCH — these break the site or cut leads off from the CRM
- `01_CRM_AND_TOOL/fmos/proxy.ts` — the auth gate + the clean-URL "host-split". Breaking it can expose the
  CRM or 404 the whole site. (The only safe edit here is the legacy `.html` redirect list, with care.)
- `01_CRM_AND_TOOL/fmos/components/ui/layout-wrapper.tsx` — decides which routes are "public". Breaking it
  wraps the marketing pages in the CRM's app shell (sidebar + light theme).
- The lead pipeline — `01_CRM_AND_TOOL/fmos/lib/inbound/capture.ts` and
  `01_CRM_AND_TOOL/fmos/lib/automations/inbound-leads.ts`. This is HOW website leads reach the CRM.
- Booking — `01_CRM_AND_TOOL/fmos/actions/site-book.ts` and `01_CRM_AND_TOOL/fmos/actions/book-meeting.ts`.
- The bot / WhatsApp — `01_CRM_AND_TOOL/fmos/lib/bot/engine.ts` and anything under
  `01_CRM_AND_TOOL/fmos/lib/whatsapp` (locked to test numbers — never change the send safety).
- Supabase clients — `01_CRM_AND_TOOL/fmos/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`.
- The forms' submit wiring: leave the `captureWebsiteLead` / `requestSiteCall` / `bookSiteMeeting` calls in
  `site-contact-form.tsx`, `site-contact-page-form.tsx`, `site-book-cta.tsx`, `site-chat.tsx` exactly as they
  are. You can restyle the form, but never change how it submits — that's the link to the CRM.
- Anything OUTSIDE `app/site`, `components/site`, `lib/blog.ts`, `lib/site`, `content/blog`, and the SEO files
  above. That's all the CRM — not the website.

## Verify, then ship
From `01_CRM_AND_TOOL/fmos`:
```
npx tsc --noEmit      # must say nothing (0 errors)
npm run build         # must finish without errors
```
If both pass: show the owner the change, then `git add` only the files you edited, commit with a short
message, and `git push` to `main`. Live in ~2 minutes. If either fails, fix it before pushing.

If a change is observable in a browser, preview it locally first (`npm run dev`, then open the page) before
pushing — never ask the owner to "check if it works."
