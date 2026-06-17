> **Current status (2026-06-17):** FMOS is **deployed \& live**. WhatsApp Cloud API is live with **33 Meta-approved templates** (source of truth: `01_CRM_AND_TOOL/fmos/WHATSAPP_TEMPLATES_FINAL.md` + `templates_final.json`). The **"curiosity" teaser flow is removed** — the type-matched PDF is now sent immediately as the **Direct Report**. Booking = Google Calendar/Meet (not Zoom/Calendly). Any obsolete notes below are kept for history.

# 03 — WhatsApp Templates
**Last Updated:** 2026-06-14 | **Status:** Content COMPLETE (17 templates in FMOS_Template_Data/). **Meta approval LIVE:** the DIRECT_REPORT family (curiosity_templates.json) is what was submitted — `direct_report_type_a/b/c` are **APPROVED/active**, `direct_report_type_d` resubmitted (de-duplicated named vars) → **in review**.

> **2026-06-14 Meta submission rules (for any new template):**
> - Category **MARKETING**, **Document** header, 2 Quick Reply buttons ("Book a meeting 📅", "Tell me more").
> - Use **named** variables `{{business_name}}`, `{{niche}}`, `{{city}}`. **Each variable may appear only ONCE** (Meta rejects duplicate variable parameters) — the source JSON repeats `{{city}}`, so de-duplicate first.
> - Body must **not start or end with a variable**. The `&` symbol is **blocked** by the validator (use "and"/omit).
> - Fastest path: **duplicate an approved template** in WhatsApp Manager, edit only the body.
> - Auto-replies (TELL_ME_MORE_REPLY, MEETING_REQUEST_REPLY, NOT_RIGHT_NOW_REPLY) are session messages — **no approval needed**.

## Folder Purpose
All WhatsApp message templates used throughout the sales flow. Templates are pre-written and loaded by FMOS. Some are sent manually by Jabeer, others are triggered automatically by Afifa's outcome logging or by bot.

## What Exists (Complete)

### FMOS_Template_Data/ — All Template Files
| File | Templates | Sent By | Trigger |
|---|---|---|---|
| `curiosity_templates.json` | 4 templates (Type A/B/C/D) | Jabeer — manual batch send | Before calls begin, per lead type |
| `bot_reply_templates.json` | 4 templates (Type A/B/C/D) | Bot — auto-send | Lead replies to curiosity message |
| `outcome_templates.json` | 6 templates | FMOS auto-send | Afifa logs call outcome |
| `followback_reminder_templates.json` | 1 template | Afifa — FMOS button | Day of the follow-back appointment |
| `post_meeting_templates.json` | 4 templates (Proposal Sent, Proposal Follow-up, Agreement Request, Invoice Sent) | Jabeer — manual | After meeting / proposal / agreement stage |
| `whatsapp.types.ts` | — | — | TypeScript interfaces: WhatsAppTemplate, TemplateFile, TemplatePlaceholders, LeadType |
| `index.ts` | — | — | Loader utility: getCuriosityTemplate(leadType), getBotReplyTemplate(type), getOutcomeTemplate(outcome), fillTemplate(msg, placeholders) |

**Total: 17 templates**

### Template Category Details

**Curiosity Templates (4):**
- One per lead type A/B/C/D
- Frame around market research data ("We ran research for [niche] in [city]...")
- Goal: get a reply (even a "no" counts — it opens the conversation)
- Require Meta WhatsApp Business API approval before sending
- Jabeer sends as mass batch before calls begin for a niche

**Bot Reply Templates (4):**
- Sent automatically when a lead replies to the curiosity message
- Sends the niche+city landing page link (NOT the PDF again — avoids duplicate)
- Goal: get lead to explore FortuneMarq portfolio
- Landing page must be live before these can be activated
- No Meta approval needed (session window reply within 24h)

**Outcome Templates (6):**
- Auto-sent by FMOS the moment Afifa logs a call outcome
- Cover: Interested-Book Now, Interested-Follow Up, Send More Info, Follow Back Scheduled, Not Interested (polite close), Dead/Wrong Number
- Most require Meta approval

**Follow-Back Reminder (1):**
- Afifa hits a button in FMOS on the day of follow-back
- Reminds lead of the agreed callback time
- Requires Meta approval

**Post Meeting Templates (4):**
- Jabeer sends manually after key milestones
- Proposal Sent: "Here's your proposal — let me know if you have questions"
- Proposal Follow-up: Day 2 if no response
- Agreement Request: "Ready to confirm? Reply Yes to confirm the agreement"
- Invoice Sent: "Invoice attached — setup fee clears the start date"

## What's Pending
- Meta WhatsApp Business API: must be purchased, connected to FMOS — this is the critical blocker
- WhatsApp template seeding: FMOS Phase D will seed these templates from JSON files into Supabase `whatsapp_templates` table
- Niche landing pages: must be live on fortunemarq.com before bot replies can be sent
- Templates need Meta approval for HSM (highly structured messages) — Jabeer submits via Meta Business Manager

## What's Blocked
- Execution blocked on FMOS deployment
- Bot reply templates additionally blocked on niche landing pages being live
- All Meta-approval templates blocked on Meta WhatsApp Business API activation

## Connections to Other Folders
- **JSON files copied to:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — for Antigravity Phase D seeding
- **Used in FMOS:** `/admin/whatsapp-templates` page (template library), WhatsApp Template Picker modal (Phase C)
- **Variable data from:** Lead profile in FMOS (businessName, city, niche, meetingDate, meetLink etc.)
- **Landing pages for bot replies:** `05_FORTUNEMARQ_ONLINE_PRESENCE/niches/` — HTML files for each niche

## Key Decisions Made (Locked)
- 17 templates total (not 28 — old count from before architecture was finalised)
- Bot reply sends landing page link, NOT another PDF
- Tone: friendly, conversational, no pressure throughout
- FortuneMarq branded as "FortuneMarq" only in message body
- Meta WhatsApp Business API required — regular WhatsApp cannot do automated sends at scale
- Template variables use {{doublebraces}} format for FMOS substitution

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Old template plan had 28 variants. |
| April 2026 | Architecture redesigned. 17 templates across 5 files created. TypeScript loader written. Bot reply changed to send landing page link instead of PDF. |
| 2026-04-28 | CONTEXT.md fully rewritten to reflect actual file inventory and template architecture. |
