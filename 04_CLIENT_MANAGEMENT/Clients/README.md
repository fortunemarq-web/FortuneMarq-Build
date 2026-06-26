# Clients — one folder per signed client

Service delivery happens **client-by-client** here (the per-service automation apps in
`02_SERVICE_DELIVERY_AUTOMATION` are on hold). Each signed client gets one folder that holds
**everything about them**: their details, every service you're delivering, and the actual
plan / strategy / work for each service.

## How to start a new client
1. Copy `_TEMPLATE/` → rename it to the client's name (e.g. `BrightSmile_Dental_Hubli`).
2. Fill in `client_profile.md` (who they are, what they bought, key dates).
3. Inside `Services/`, copy `_SERVICE_TEMPLATE/` once per service they bought (e.g. `GMB/`, `SEO/`).
4. Do the planning, strategy, and work for each service inside its own folder.

## Folder shape
```
<Client_Name>/
├── client_profile.md      ← all client details (contact, package, dates, logins location)
├── Services/
│   └── <SERVICE>/         ← one per purchased service
│       ├── plan.md        ← what we'll do + milestones
│       ├── strategy.md    ← the thinking/approach
│       └── work/          ← the actual deliverables & working files
├── monthly_reports/       ← the reports sent to the client each month
└── assets/                ← logos, brand files, credentials note (links to Drive)
```

## How this connects to FMOS
- The **live** side of the client — their record, tasks, invoices, health — lives in FMOS (`/admin/clients`).
- This folder is the **planning + delivery workspace**: plan here → execute/track in FMOS → snapshot results back into `monthly_reports/` and `03_results` notes.
- Services map to the sellable services + prices in `08_FINANCE/Pricing_Decisions` and the proposal builder.

## Conventions
- Real client names use the client's actual business name (underscores for spaces).
- Folders starting with `_` are templates/examples — never delete `_TEMPLATE/`.
- Heavy media (raw footage, large design files) → Google Drive, linked from `assets/` — never stored in-repo.
- Never store passwords/API keys in here. Keep a note in `assets/` pointing to where credentials live.
