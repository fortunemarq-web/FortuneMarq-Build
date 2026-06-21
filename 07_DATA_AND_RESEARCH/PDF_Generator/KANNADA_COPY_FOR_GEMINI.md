# Kannada copy for the 5-page report design — Gemini conversion

This is the **actual English copy** used in the PDF report design (the 5-page editorial
reports). Convert it to Kannada, then paste it back and it will be wired into the generator
(the Kannada shaping/rendering is already built and working).

---

## PROMPT (paste this above the copy when you give it to Gemini)

> You are translating marketing report copy from English to **Kannada** for a digital-marketing
> agency (FortuneMarq) whose customers are small business owners in Karnataka.
>
> Rules:
> 1. **Natural, casual, spoken Kannada** — the way a Kannadiga would actually say it. NOT
>    word-for-word/literal translation. If a literal translation sounds awkward, rewrite the
>    sentence so it sounds normal and clear.
> 2. **Minimal English.** Keep ONLY true brand/product names in English: Google, Google Maps,
>    Google Keyword Planner, Google Ads, Meta Ads, GMB, JustDial, WhatsApp, SEO, FortuneMarq,
>    Instagram, Facebook. Everything else → Kannada (including words like "searches", "website",
>    "directories", "report", "visibility", "customers", "month", "business").
> 3. **Keep the placeholders EXACTLY as written**, in English, unchanged: `{volume}`, `{city}`,
>    `{niche}`, `{count}`, `{reviews}`. Do not translate or move them.
> 4. Keep it **short** — these sit in a designed layout. Match the length of the English line;
>    don't add extra words.
> 5. Return it in the **same structure/labels** as below so it can be pasted straight back.
> 6. ALL-CAPS section labels (e.g. WHERE THIS TRAFFIC GOES) can be normal Kannada case.

---

## SHARED (used on every report)

- `hero_label`: monthly searches for {niche} in {city}
- `source_tag`: SOURCE: Google Keyword Planner
- `page2_header`: The Search Demand in {city}
- `page2_intro`: Every month {volume} people in {city} search for {niche} on Google.
- `page2_verified`: Verified data from Google Keyword Planner — the same tool Google uses for its own platform.
- `where_traffic_goes`: WHERE THIS TRAFFIC GOES
- `bar_gmb`: GMB Profiles
- `bar_directories`: Directories (JustDial etc.)
- `bar_social`: Social Media
- `bar_websites`: Local Websites
- `searches_per_month`: {count} searches/month
- `page3_header`: Who Is Getting This Traffic Right Now
- `gbp_top3_label`: GOOGLE BUSINESS PROFILE — TOP 3 RESULTS
- `gbp_capture_line`: These 3 businesses capture an estimated {count} searches every month through Google Maps
- `directories_capture`: DIRECTORIES — CAPTURING {count} SEARCHES
- `websites_capture`: LOCAL WEBSITES — CAPTURING {count} SEARCHES
- `reviews_suffix`: ({reviews} reviews)
- `cta_headline`: Let's Talk About Your Growth
- `cta_sub`: Book a free consultation to discuss the opportunity, scope, and how you can grow your business
- `cta_button`: Book Your Free Consultation
- `tagline`: Marketing That Pays You Back

---

## TYPE A — VISIBILITY REPORT (lead is ranking on Google)

- `badge`: VISIBILITY REPORT
- `headline_1`: You Are Already on
- `headline_2`: Google Page 1
- `subheadline`: Here is what that visibility is worth — and what you could be capturing
- `cover_callout_1`: You are currently visible. The opportunity is to maximise
- `cover_callout_2`: every search that finds you.
- `page2_callout_1`: You are capturing a share of this traffic.
- `page2_callout_2`: The question is — how much more could you capture?
- `page4_headline`: What You Could Still Be Capturing
- `page4_box_1`: people see a GMB profile — are they seeing yours first?
- `page4_box_2`: searches go to directories — are you listed and optimised?
- `page4_box_3`: people visit local websites — is yours converting them?
- `page4_insight_1`: Being on Page 1 is the first step. Owning that position
- `page4_insight_2`: and converting every visit is the next.
- `page4_sub`: Maximise every search that finds you by strengthening each channel.

---

## TYPE B — WEBSITE PERFORMANCE REPORT (has website, not ranking)

- `badge`: WEBSITE PERFORMANCE REPORT
- `headline_1`: {volume} People Searched
- `headline_2`: For {niche} in {city}
- `headline_3`: Last Month
- `subheadline`: Your website exists — but it was not in these results
- `cover_callout_1`: Having a website and being found on Google
- `cover_callout_2`: are two different things
- `page2_callout_1`: You have a website. But Google is not surfacing it
- `page2_callout_2`: when people search for your services.
- `page4_headline`: The Gap Between Your Website and Google
- `page4_box_1`: people searched on Google Maps — your GMB needs optimisation
- `page4_box_2`: searches went to directories — is your business listed?
- `page4_box_3`: people visited local websites — yours was not one of them
- `page4_insight_1`: Your website is built. The next step is making Google
- `page4_insight_2`: surface it when {volume} people search every month.
- `page4_sub`: SEO and GMB optimisation closes the gap between your site and your customers.

---

## TYPE C — MARKET OPPORTUNITY REPORT (no website)

- `badge`: MARKET OPPORTUNITY REPORT
- `headline_1`: {volume} People Searched
- `headline_2`: For {niche} in {city}
- `headline_3`: Last Month
- `subheadline`: Here is exactly where that search traffic is going right now
- `cover_callout_1`: This report shows where your potential customers are going
- `cover_callout_2`: and what it would take for them to find you instead
- `page2_callout_1`: Right now 100% of this traffic is going to other businesses
- `page2_callout_2`: Every search that goes unanswered is a customer walking into your competitor
- `page4_headline`: The Cost of Not Being Found
- `page4_box_1`: people clicked a GMB profile this month
- `page4_box_2`: searches went to JustDial and directories
- `page4_box_3`: people visited local {niche} websites
- `page4_insight_1`: Without a digital presence, every one of these
- `page4_insight_2`: {volume} monthly searches ends at someone else's door.
- `page4_sub`: A complete digital presence means showing up where these searches land.

---

## TYPE D — NICHE MARKET REPORT (low-volume niche)

- `badge`: NICHE MARKET REPORT
- `headline_1`: Only {volume} People
- `headline_2`: Search For {niche}
- `headline_3`: in {city} Every Month
- `subheadline`: Every single one of them is ready to buy — here is how to capture them all
- `cover_callout_1`: Small market. High intent. Low competition.
- `cover_callout_2`: Every search matters.
- `page2_callout_1`: In a focused market every single search is a potential customer
- `page2_callout_2`: with a specific need — and low competition to beat.
- `page4_headline`: The Small Market Advantage
- `page4_box_1`: GMB clicks per month — a strong profile captures all
- `page4_box_2`: directory searches — low competition, easy visibility
- `page4_box_3`: website visitors — high intent, ready to buy
- `page4_insight_1`: Small volume means less competition. The businesses showing up
- `page4_insight_2`: now are not heavily optimised — the bar to rank is lower.
- `page4_sub`: In a niche market, one strong digital presence can dominate all search results.

---

## PART 2 — page-4 "Growth Partner" block (shared by all reports — still English in the sample)

These are the only remaining English strings. Same rules as above (natural Kannada,
keep service names like Local SEO / Google Ads / Meta Ads as-is if they read better).

- `card_caption_1`: None of them were yours
- `card_caption_2`: JustDial owns that customer
- `card_caption_3`: Your competitor — not you
- `growth_section`: YOUR GROWTH PARTNER — NOT JUST AN AGENCY
- `growth_blurb_1`: FortuneMarq builds and manages your complete online presence — so you focus on
- `growth_blurb_2`: running your business while customers find you on Google.
- `service_1_title`: Google Business Profile   | `service_1_desc`: Get found on Google Maps
- `service_2_title`: Business Website          | `service_2_desc`: Convert visitors into calls
- `service_3_title`: Local SEO                 | `service_3_desc`: Rank higher on Google organically
- `service_4_title`: Google Ads               | `service_4_desc`: Top of Google instantly
- `service_5_title`: Meta Ads                 | `service_5_desc`: Instagram & Facebook reach
- `service_6_title`: Monthly Reports          | `service_6_desc`: Clear ROI report every month
