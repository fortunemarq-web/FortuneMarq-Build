# Paid Marketing — open tasks (2026-06-25)

## ☐ Future build — campaign tracker in FMOS
Unlike the other channels, paid marketing has **no dedicated tracker page** in FMOS. Until built,
campaigns are tracked as generic tagged tasks in `/tasks` + `/admin/growth/acquisition`.
- **Task:** add a **Campaign tracker** under the growth hub (mirror `app/admin/growth/acquisition/[city]/page.tsx`)
  — list campaigns by city × niche with status, spend, leads, CPL, booked/won, pulling from the ad platforms
  + FMOS lead data. This gives paid marketing the same purpose-built progress view the other channels have.

## ☐ Before launch (from `conversion-tracking-checklist.md`)
- Set `META_CAPI_TOKEN`; fix `google-oci.ts` for the June-2026 Data Manager API migration; add the
  `/api/cron/ad-conversions` step to the cron workflow; add first-party data for Enhanced Conversions.

> Load these into FMOS `/admin/strategy` or `/tasks` when prioritised. Launch switches stay OFF until go-live.
