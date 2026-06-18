# Add Blogs — write and publish a FortuneMarq blog post

You're here to write and publish a blog post. The owner gives you a topic (or asks you to suggest
one); you plan it, write it, show it, and publish it. They are not technical — do all the work.

**First read** `01_CRM_AND_TOOL/fmos/app/site/README.md` (the "Blog" section) and the owner guide
`01_CRM_AND_TOOL/fmos/app/site/BLOG_HOW_TO.md`. All commands run from `01_CRM_AND_TOOL/fmos`.

## How the blog works (this is the whole system)
Each post is **one plain Markdown file** in `01_CRM_AND_TOOL/fmos/content/blog/`. That's it. When you
add a `.md` file there and push, the post automatically:
- appears on the `/blog` page and the card grid,
- gets its own page at `/blog/<filename>`,
- is added to the sitemap (so Google finds it),
- gets full SEO (title, description, social preview, Article structured data).

**You only ever create / edit `.md` files in that one folder.** Everything else is automatic.

## The workflow
1. **Plan with the owner.** Agree the topic, the angle, and who it's for. Good FortuneMarq posts are:
   - written for **business owners in Hubli/Karnataka**, not for marketers,
   - **plain English**, no jargon, confident and honest (the "marketing that pays you back" ethos),
   - **SEO-aware**: pick one clear topic + a natural keyword (e.g. "Google Business Profile for Hubli
     restaurants") and use it in the title, the description, and a heading,
   - ~**600–1000 words**, broken into a few `##` sections, ending with a soft call to action.
2. **Write the file** `01_CRM_AND_TOOL/fmos/content/blog/<short-slug>.md` (lowercase, hyphens, no spaces),
   using the template below.
3. **Show the owner** the draft (paste the text). Make any edits they ask for.
4. **Verify** from `01_CRM_AND_TOOL/fmos`:
   ```
   npx tsc --noEmit
   npm run build
   ```
5. **Publish:** `git add` the new file, commit with a short message, `git push` to `main`. Live in ~2 min.

## Post template
```markdown
---
title: Your Headline in Title Case
description: One or two sentences — this is the Google snippet and the card text.
date: 2026-06-20
author: FortuneMarq
image: /site/images/og-default.png
tags: [Local SEO, Google Ads]
---

Open with the reader's problem in their words.

## A clear section heading

Body text. Use **bold** for emphasis, _italic_ sparingly, and
- bullet points
- for lists.

## Another section

Wrap up with a soft nudge to get in touch — see the rule about links below.
```
- `date` = YYYY-MM-DD (controls ordering; newest first).
- `image` is optional. For a much nicer card + social preview, give the post its **own 1200×630 image**
  in `01_CRM_AND_TOOL/fmos/public/site/images/` and point `image` at it. Otherwise it falls back to the brand image.
- `tags` is optional; the first tag shows on the card.

## ⚠️ Important writing rules
- **Do NOT put Markdown links to site routes** (like `/contact`, `/services`) in the post body — the repo's
  docs-check will block the commit, and the post page already shows a "Book a Strategy Call" button at the
  bottom automatically. Write CTAs as plain text ("book a strategy call with us"). External `https://` links
  are fine.
- **Draft, not ready to publish?** Name the file starting with an underscore, e.g. `_my-draft.md`. Anything
  starting with `_` stays hidden from the live site until you rename it.
- Keep it honest: no fake stats, no guarantees, no "we're the #1 agency", no war/combat language.

## 🚫 DO NOT TOUCH
The blog **engine** is already built and working — only create/edit `.md` files in `content/blog/`. Do NOT
edit any of these (changing them can break every blog page):
- `01_CRM_AND_TOOL/fmos/lib/blog.ts`
- `01_CRM_AND_TOOL/fmos/app/site/blog/page.tsx`
- the `.blog-*` / `.post-*` styles in `01_CRM_AND_TOOL/fmos/app/site/site.css`
- `01_CRM_AND_TOOL/fmos/app/sitemap.ts`
And never touch anything outside `content/blog/` (and a post image in `public/site/images/`) for a blog task.
