# On-Page SEO Checklist — per page

Run this for each public page, then make the edits in the app (`lib/site/seo.ts` + the page `.tsx`) and deploy via `Website/Website-Changes`.

## Per page
- [ ] Unique **title** (~55–60 chars) with the target keyword near the front
- [ ] Unique **meta description** (~150 chars), compelling + keyword present
- [ ] One **H1** containing the target term; logical H2/H3 structure
- [ ] Target keyword used naturally in the first paragraph + a heading (no stuffing)
- [ ] Descriptive **image alt** text
- [ ] Internal links to/from relevant pages (services ↔ work ↔ contact)
- [ ] Clean, readable URL
- [ ] Mobile-fast (check PageSpeed)

## Site-wide / local
- [ ] NAP identical across site + GMB + directories
- [ ] LocalBusiness structured data present (`lib/site/seo.ts`)
- [ ] Sitemap submitted in Search Console (already done) + no coverage errors
- [ ] robots.txt not blocking anything important

## Measure (weekly, in Search Console)
- [ ] Note pages with impressions but low CTR/position → next optimization targets
