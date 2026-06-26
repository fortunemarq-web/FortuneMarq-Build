# 02_SERVICE_DELIVERY_AUTOMATION — Working guide

Plans for the three systems that **deliver client work at scale**: Ads, SEO, and the Website Brief App.
The goal is serving 30–50 clients without proportional manual effort. `CONTEXT.md` has the full inventory;
this file is **how to work here**.

## ⚠️ The one distinction that matters
This folder is **client delivery** — running work *for paying clients*. It is **NOT** FortuneMarq's own
marketing spend, which lives in `06_PAID_MARKETING`. If you're planning ads/SEO for *a client*, you're here.
If it's *FortuneMarq advertising itself*, that's 06.

## To change something, open the sub-area
| Want to plan/change… | Open |
|---|---|
| Client Google/Meta ad management | `Ads_Automation/` |
| Client SEO retainers (ranking, content, reports) | `SEO_Automation/` |
| Turning client briefs into website build specs | `Website_Design_and_Brief_App/` |

## How this connects to FMOS
- These are **specs/plans**; the live execution (client records, tasks, freelancer assignment, delivery tracking) happens in FMOS (`/admin/clients`, the delivery-load view, tasks/projects).
- The services planned here map to the sellable services in the proposal builder (`01_CRM_AND_TOOL/fmos/lib/data/services_data.json`: `GOOGLE_ADS`, `META_ADS`, `SEO`, `WEBSITE`) and their prices in `08_FINANCE/Pricing_Decisions`.
- Monthly client reporting produced by these systems feeds `04_CLIENT_MANAGEMENT/Monthly_Reports`.

## Boundaries
- Planning docs only — no app source, no client data dumps, no secrets.
- Client deliverables that are "live" belong in FMOS, not here.
