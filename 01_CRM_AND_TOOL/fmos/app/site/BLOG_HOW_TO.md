# How to publish a blog post (the easy way)

You don't touch code. You just tell Claude Code what you want.

## Publish a new post
Say to Claude:
> "Write a blog post about [your topic]. Make it about 600 words, plain English, for Hubli business owners."

Claude will:
1. Create the post file in `content/blog/`.
2. Show it to you (you can ask for any edits — "make it shorter", "add a section on X").
3. When you're happy, ask Claude to **commit and push**.

A minute or two after the push, the post is **live** at `fortunemarq.com/blog/your-post`, it appears on the `/blog` page automatically, and it's added to your sitemap so Google can find it. Nothing else to do.

## Edit or delete a post later
- Edit: *"Update the blog post about X — change the intro."*
- Delete: *"Remove the blog post about X."*
- Then: *"commit and push."*

## A draft you're not ready to publish
Ask Claude to name the file starting with an underscore, e.g. `_my-draft.md`. Anything starting with `_` stays hidden from the live site until you rename it.

---

### For reference — what a post file looks like
Each post is one plain-text file in `content/blog/`. The top part (between the `---` lines) is the post's info; below it is the article in Markdown:

```markdown
---
title: Your headline here
description: A one or two sentence summary (used for Google + the card).
date: 2026-06-20
author: FortuneMarq
image: /site/images/og-default.png    # optional — a feature image for the card/share
tags: [Local SEO, Google Ads]         # optional
---

Your article goes here. Use # for big headings, **bold**, _italic_,
- bullet points,
and [links like this](/contact#book).
```

You never have to write this yourself — Claude does. This is just so you know what's happening under the hood.

**Tip:** giving each post its own `image` (a 1200×630 picture) makes the blog cards and social shares look much better than the default.
