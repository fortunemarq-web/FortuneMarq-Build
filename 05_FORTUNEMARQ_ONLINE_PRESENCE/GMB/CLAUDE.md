# GMB — Working guide (FortuneMarq's own Google Business Profile)

This folder runs **FortuneMarq's own Google Business Profile** — the map/listing for searches like
"digital marketing agency Hubli". Right now this is **manual work** (no API yet). This file = how to work here.

**Current state:** profile created + verified, **not yet optimized**.

## How GMB connects to the rest
- It's an **inbound channel**: calls/messages/clicks from the listing become leads → when they reach FMOS they're tagged `source: gmb`.
- GMB is also a **service we sell** (₹3,500/mo, see `08_FINANCE/Pricing_Decisions`). What we learn optimizing our own listing feeds the client version in `04_CLIENT_MANAGEMENT/Clients/<Client>/Services/GMB`.
- There's an app stub to grow into later: `01_CRM_AND_TOOL/fmos/app/admin/growth/gmb`.

## The manual workflow (do this now)
Everything is done by hand in the Google Business Profile dashboard. This folder holds the **plan + records**:
1. **Profile basics** — keep `profile.md` matching the live listing (categories, services, description, hours, contact).
2. **Photos** — track what's uploaded vs needed in `photos/` (target 15+: storefront, team, work samples). Heavy files → Google Drive, linked.
3. **Posts** — draft ~2/week in `posts/` (offers, tips, updates), then post manually. Keep a running log.
4. **Reviews** — use `reviews.md` to track review requests and store reply templates; reply to every review by hand.
5. Keep the brand voice: plain, honest, no "we're #1", no war/combat language.

## ⚠️ Future plan — acquiring the Business Profile API
When there's time, automate this (most valuable as a **client-delivery** tool, with our own listing as location #1):
- **API is OAuth-based, not a simple key**, and **access is gated** — must apply, need a verified profile active 60+ days + a valid website; approval takes **days–weeks**. **Start the access request early.**
- **What it would automate:** review replies (AI-drafted, approved), scheduled/recurring posts, performance metrics (calls/views/searches → dashboard + client reports), info/photo updates, and multi-location management for clients.
- **Note:** the **Q&A API was shut down (Nov 2025)** — Q&A stays manual.
- **For clients:** once approved, each client adds FortuneMarq as a manager (or authorizes via OAuth) and the same automations run on their listing. The OAuth app also needs Google verification for external/client use — also slow, so start early.
- Build it in FMOS env-gated (like the ad-conversion uploader), do nothing until tokens/access are in place.

## Boundaries
- Planning/records only — no passwords or OAuth tokens stored here.
