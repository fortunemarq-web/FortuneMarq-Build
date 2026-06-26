# 00_MASTER/Bot_Knowledge_Base — Working guide (open this folder in Cowork to change the AI bot)

This folder is the **single source of truth the AI bot (6.1) answers from** — web chat, WhatsApp,
and IG/Messenger. Edit the markdown here, and after a reload the bot speaks the new answers.
`README.md` lists the files and their load order. This file is **how to change things safely**.

## To change something, open the file that matches the topic
| Want to change… | Open this file |
|---|---|
| Prices the bot quotes | `pricing.md` |
| What we sell / packages | `services.md` |
| Common questions & answers | `faqs.md` |
| How the bot handles pushback | `objections.md` |
| Tone, hard rules, when to escalate to a human | `guardrails_and_escalation.md` |
| Who we are / positioning | `company.md` |

**Workflow in Cowork:** open this folder → tell Cowork what to change → it edits the right file →
then the knowledge base must be **reloaded into FMOS** (run `01_CRM_AND_TOOL/fmos/scripts/sync_bot_kb.mjs`).
Until that reload runs, the live bot still uses the old answers.

## ⚠️ Ripple effects — a change here also touches these (keep them in sync)
| If you change… | It must also match / it affects… |
|---|---|
| **`pricing.md`** | `08_FINANCE/Pricing_Decisions` (the master price list — they must be identical), the proposal prices in the app (`01_CRM_AND_TOOL/fmos/lib/data/services_data.json`), and any prices shown on the landing pages / marketing site. Change the number in **all** of these, not just here. The bot must never quote outside the locked list — discounts/custom = escalate to Jabeer. |
| **`services.md`** | The 7 sellable services are mirrored in the app's proposal builder (`01_CRM_AND_TOOL/fmos/lib/data/services_data.json`) and on the LPs. Adding/removing/renaming a service means updating those too. |
| **`faqs.md` / `objections.md`** | Should tell the same story as the telecaller scripts (`03_SALES_SYSTEM/Telecaller_Scripts`) and the proposal copy — a lead shouldn't hear one thing from the bot and another from a caller. |
| **`guardrails_and_escalation.md`** | Controls bot behavior + when it hands off to a human (the app's human-takeover, `leads.bot_paused`). Loosening/tightening rules changes what the bot will say unsupervised — change deliberately. |
| **`company.md`** | Identity must match `00_MASTER/MASTER_CONTEXT.md` and the legal identity in the website footer. |

## Boundaries
- Markdown knowledge files only — no code, no secrets.
- Don't drop a file from the load set without updating `README.md`'s ordered list.
- Never fabricate prices, results, or guarantees. "No performance/results guarantees" is a standing rule.
