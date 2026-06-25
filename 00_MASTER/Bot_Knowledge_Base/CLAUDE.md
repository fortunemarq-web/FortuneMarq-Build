# 00_MASTER/Bot_Knowledge_Base — Working instructions for Claude

The **single source of truth the AI bot (6.1) answers from** across web + WhatsApp + IG/Messenger.
Inventory + load order are in `README.md`; this file is **how to work here**.

## How to work here
- Edits here change what the live bot says. Treat copy as customer-facing — accurate, on-brand, no fabrication.
- **Pricing is LOCKED** (`pricing.md`) — never introduce a price that contradicts `08_FINANCE/Pricing_Decisions`. Keep the two in sync; if they diverge, fix here to match Finance, don't invent.
- Keep `services.md` aligned with what's actually sold (proposal services in `lib/data/services_data.json`) and `company.md` aligned with `MASTER_CONTEXT.md` identity.
- `guardrails_and_escalation.md` is safety-critical — change tone/escalation rules deliberately, not casually.
- After editing, the bot KB must be reloaded into FMOS (run `01_CRM_AND_TOOL/fmos/scripts/sync_bot_kb.mjs`). Note in your reply that a reload is needed.

## Boundaries
- Markdown knowledge files only. No code, no secrets.
- Don't remove a file from the load set without updating `README.md`'s ordered list.
