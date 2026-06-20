# FMOS — Manual Testing Guide (verify-the-result)

_Companion to `FMOS_APP_WORKFLOW.md`. Last mapped: 2026-06-19 · branch `continue-on-mac` · live: fmos.fortunemarq.com · Supabase project `cnwooodktqwvpzkucskm`._

This guide makes you **verify what each button actually did**, not just trust a success toast. Every test tells you the action, what it should change in the database, and gives you (a) a UI place to look and (b) a copy-paste **SQL query** to confirm the row/column really changed. Then you mark it PASS or log an ISSUE.

---

## How to use this guide

1. **Run SQL in the Supabase dashboard** → project `cnwooodktqwvpzkucskm` → SQL Editor. Every query here is read-only (`SELECT`). Replace `<lead_id>`, `<client_id>`, `<id>`, `<uid>` etc. with the real id from the row you just touched (copy it from the URL or from the "before" query).
2. **Always run the "before" query first** when a test changes a value — so you can prove it changed, not that it was already that value.
3. **Mark each test:** `☑ PASS` or `☐ ISSUE:` with a one-line note (what you saw vs what was expected). Use the **Issue Log** table at the bottom.
4. **Order = priority.** Tier 0 is the money path — do it first and do it carefully. Tier 2 is supporting/admin.
5. **Known limitations** are tagged `⚠ KNOWN` inline and listed in **Appendix A**. Verify them to understand them, but they are documented behavior — don't log them as new bugs.

### Test environment setup (do once)

- **Use a disposable test lead.** Create one via `/sales` → **Add Lead** (TEST-LEAD, phone = one of the **allowlisted QA numbers** `+918904192656` or `+919353082656`). Using an allowlisted number means WhatsApp flows can run end-to-end and only your QA phone ever receives anything.
- **Confirm WhatsApp is in safe mode** before any send test:
  ```sql
  select key, value from app_settings where key in ('whatsapp_auto_greeting','whatsapp_messaging_health');
  ```
  And confirm with the team that `WHATSAPP_LAUNCH` is unset and the allowlist holds the QA numbers. **Do not change these envs.**
- **To test a WhatsApp send without messaging anyone:** you don't need the message to arrive — just confirm the `whatsapp_logs` row was written (queries provided).
- **Find your own user id** (for analytics tests):
  ```sql
  select id, full_name, role from profiles order by full_name;
  ```

### Verification toolkit (handy queries)

```sql
-- Latest touch on a lead (calls, PDFs, WA touches)
select touch_type, outcome, notes, pdf_name, created_at
from outreach_logs where lead_id='<lead_id>' order by created_at desc limit 5;

-- A lead's pipeline state
select company_name, outreach_stage, status, last_outcome, follow_up_date,
       meeting_booked_at, assigned_sales_exec, last_activity_at, tags
from leads where id='<lead_id>';

-- Every WhatsApp send/receive for a lead (template name is inside message_sent)
select direction, message_type, message_sent, delivery_status, delivery_error, sent_by, sent_at
from whatsapp_logs where lead_id='<lead_id>' order by sent_at desc limit 10;

-- Queued WhatsApp (reminders / follow-ups)
select template_name, fire_at, status, error from scheduled_messages
where lead_id='<lead_id>' order by fire_at;

-- Audit trail for any record
select action, resource_type, new_value, created_at from audit_logs
where resource_id='<id>' order by created_at desc limit 5;
```

---

# TIER 0 — Critical revenue path

## Sales: calling & outcome logging

### SALES-01 · Log a call outcome (the single most important action)
**Where:** `/sales` → select a lead → **Log Outcome** → pick **Interested — Follow Up Later** → set **Tomorrow** + a time → **Save & Next Lead**.
**Should do:** insert one `outreach_logs` row (`touch_type='call'`, `outcome='INTERESTED_FOLLOW_UP'`) and move the lead to `outreach_stage='follow_up_due'` with `follow_up_date` set; queues an outcome WhatsApp.
**Expect (UI):** toast "Outcome logged"; the "Today" Calls counter ticks up by 1; the lead leaves the Priority Queue and shows under **Follow-ups**.
**Verify (DB):**
```sql
select touch_type, outcome, notes, created_at from outreach_logs where lead_id='<lead_id>' order by created_at desc limit 1;
select outreach_stage, status, last_outcome, follow_up_date, last_activity_at from leads where id='<lead_id>';
```
✅ Pass if: a fresh `outreach_logs` row exists with the right outcome AND `outreach_stage='follow_up_due'` AND `follow_up_date` matches what you picked.
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-02 · Outcome variants (run each once)
Repeat SALES-01 for each outcome and confirm the stage mapping:

| Outcome picked | Expect `outreach_stage` | Extra to check |
|---|---|---|
| Interested — Book Meeting Now | `meeting_booked` | also triggers DEAL-01 (meeting + WA + reminders) |
| Interested — Send Info / PDF | `pdf_sent` | `outreach_logs.touch_type='pdf_sent'`, `pdf_name` set |
| Not Interested (+reason) | `not_interested` | `outreach_logs.notes` = reason |
| Follow Back Later (+date ≥24h) | `follow_back` | queues `followback_reminder_busy` in `scheduled_messages` |
| No Answer ×3 | `no_answer` → `unreachable` at 3 | `leads.no_answer_count` increments |
| Gatekeeper ×3 | `gatekeeper` → `gatekeeper_flagged` at 3 | `leads.gatekeeper_count` increments |
| Wrong / Dead Number | `dead` | — |
| Language Barrier | `language_barrier` | — |
**Verify (DB):** `select outreach_stage, no_answer_count, gatekeeper_count from leads where id='<lead_id>';` + the toolkit `scheduled_messages` query.
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-03 · PDF send feeds the PDF Log
**Where:** SALES-02 "Send Info / PDF" path → pick a PDF in the modal.
**Verify (DB):** `select pdf_name, touch_type from outreach_logs where lead_id='<lead_id>' and touch_type='pdf_sent' order by created_at desc limit 1;`
**Then check UI:** `/admin/outreach/pdf-log` should show a row.
⚠ KNOWN: the PDF-Log table's **Lead Name / Niche / City / Sent By / Stage columns show "—"** (the query omits the joins) and the filter dropdowns are empty. The row appearing at all = pass; the blank columns are Appendix A item, not a new bug.
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-04 · Add a lead manually
**Where:** `/sales` → **+** → fill Business + phone (a QA number) → **Add Lead**.
**Should do:** insert a `leads` row; duplicate phone/name triggers a confirm prompt first.
**Verify (DB):**
```sql
select id, company_name, phone, lead_type, source, lead_source, captured_at, outreach_stage
from leads where company_name='<name>' order by created_at desc limit 1;
```
✅ Pass if: row exists with your data. Note `outreach_stage` is null (new leads land in Priority Queue, not Follow-ups) — expected.
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-05 · Outreach Kanban drag = stage change (admin only)
**Where:** `/admin/outreach` → drag a card to another column.
**Verify (DB):** `select outreach_stage, status, last_activity_at from leads where id='<lead_id>';` and `select action, new_value from audit_logs where resource_id='<lead_id>' order by created_at desc limit 1;`
✅ Pass if: stage matches the new column after a refresh AND an audit row exists. (Drag is disabled for non-admins — expected.)
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-06 · Lead profile edits (`/admin/leads/[id]`)
Test each and verify the column:
- Inline-edit Business/Phone/City/Website/GMB → `select company_name,phone,city,website_link,gmb_link from leads where id='<lead_id>';`
- Toggles Has Website / SERP Ranked / Bot → `select has_website,serp_ranked,bot_paused from leads where id='<lead_id>';`
- Stage override / Move to Revival / Mark Dead → `select outreach_stage,status from leads where id='<lead_id>';`
- Assigned To → `select assigned_sales_exec from leads where id='<lead_id>';`
- WhatsApp Template → "Copy & Send" → `select touch_type,outcome,note from outreach_logs where lead_id='<lead_id>' order by created_at desc limit 1;`
✅ Pass if: each column reflects your change.
**Result:** ☐ PASS ☐ ISSUE: ________________

### SALES-07 · Leads management list (`/admin/sales/leads`)
- Row click → **Peek panel** → change Stage / Assigned-To → verify `outreach_stage`/`assigned_sales_exec`.
- Bulk select → **Change status** / **Assign** → `select id,outreach_stage,assigned_sales_exec from leads where id = any('{<id1>,<id2>}');`
- Bulk **Export CSV** → file downloads; `select count(*) from audit_logs where action='export';` (count goes up). ⚠ KNOWN: export uses current filters, ignores your row selection.
**Result:** ☐ PASS ☐ ISSUE: ________________

## WhatsApp & Bot

> For all WA tests, send **from / to the allowlisted QA number**. If you don't want a message to arrive, just verify the `whatsapp_logs` row.

### WA-01 · Inbound message creates/loads a conversation
**Where:** from the QA phone, WhatsApp the WABA number.
**Should do:** known lead → log inbound + stamp `last_inbound_at`; unknown number → create a lead + send the language-picker greeting.
**Expect (UI):** the conversation appears in `/admin/inbox`; assigned exec gets a bell notification.
**Verify (DB):**
```sql
select direction, message_sent, wa_message_id, sent_at from whatsapp_logs where lead_id='<lead_id>' order by sent_at desc limit 5;
select last_inbound_at, last_activity_at from leads where id='<lead_id>';
```
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-02 · Language picker → guided menu taps
**Where:** tap **English** on the greeting, then walk the menu (business name → what-you-do → a service → **Book a meeting** → a slot, or **Talk to a human**).
**Verify (DB):**
```sql
select wa_lang, wa_stage, company_name, bot_paused from leads where id='<lead_id>';
```
✅ Pass if: `wa_lang='en'`, `wa_stage` advances (`await_name`→`await_about`→`done`), name captured; **human handoff** sets `bot_paused=true` and writes a `notifications` row.
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-03 · AI bot free-text reply
**Where:** from QA phone, send a free-text question (e.g. "how much for a website?").
**Verify (DB):** `select role, content, escalated, created_at from bot_threads where lead_id='<lead_id>' order by created_at desc limit 4;`
✅ Pass if: a `user` turn and an `assistant` turn are logged and the reply arrived. (Needs `ANTHROPIC_API_KEY`; without it you get a static fallback reply.)
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-04 · Bot escalation / handoff
**Where:** send a trigger phrase (e.g. "this is too expensive, I want to speak to a person").
**Verify (DB):** `select escalated from bot_threads where lead_id='<lead_id>' and escalated=true limit 1;` and `select message_sent from whatsapp_logs where message_sent like '%admin_alert%' order by sent_at desc limit 1;`
✅ Pass if: conversation shows **Escalated** in the inbox, `bot_paused` set, and an `admin_alert` send is logged.
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-05 · STOP / START opt-out
**Where:** send "STOP", then "START".
**Verify (DB):** `select wa_opt_out from leads where id='<lead_id>';` (true after STOP, false after START). Inbox shows "Opted out" + disabled composer after STOP.
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-06 · Inbox take-over + human reply
**Where:** `/admin/inbox` → open the conversation → **Take over** → type a reply → **Send**.
**Should do:** `toggleBotPaused` sets `leads.bot_paused=true`; `sendInboxReply` sends a free-text WA (24h window only) logged with your `sent_by`.
**Verify (DB):**
```sql
select bot_paused from leads where id='<lead_id>';
select message_sent, sent_by, direction from whatsapp_logs where lead_id='<lead_id>' order by sent_at desc limit 1;
```
✅ Pass if: bot paused, outbound "Team" bubble logged. Outside the 24h window you should get the "outside the 24-hour window" error and **no** send — that's correct.
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-07 · Inbox transcript matches the DB
**Where:** open any conversation drawer.
**Verify (DB):** `select direction, message_sent, sent_at from whatsapp_logs where lead_id='<lead_id>' order by sent_at;` — the drawer (merged with `bot_threads`) should match this timeline.
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-08 · Outcome auto-send param counts (regression guard)
**Where:** in `/sales`, log each interested/not-interested outcome on a QA-number lead and confirm the right template went with valid params (this is the cluster that was broken and fixed).
**Verify (DB):**
```sql
select message_sent, message_type, delivery_status, delivery_error
from whatsapp_logs where lead_id='<lead_id>' and direction='outbound' order by sent_at desc limit 5;
```
Expect template per outcome: BOOK→`meeting_confirmation`, FOLLOW_UP→`followup_scheduled`, SEND_INFO→`send_info`, NOT_INTERESTED→`not_interested`, FOLLOW_BACK→`follow_back`.
✅ Pass if: each send shows in `message_sent` and `delivery_error` is **null** (a `132000` param-count error here = regression — log it).
**Result:** ☐ PASS ☐ ISSUE: ________________

### WA-09 · Scheduled-messages cron fires reminders
**Where:** after booking a meeting (DEAL-01), a 1h + 15m reminder are queued. To test the cron on demand, ask the team to run:
`curl -X POST $BASE_URL/api/cron/scheduled-messages -H "Authorization: Bearer $CRON_SECRET"`
**Verify (DB):** `select template_name, fire_at, status, sent_at, error from scheduled_messages where lead_id='<lead_id>' order by fire_at;`
✅ Pass if: due rows flip `status='pending'→'sent'`. ⚠ Reminders with a past `fire_at` at booking time are skipped by design.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Deals: meeting → proposal → agreement → won

### DEAL-01 · Book a meeting (from cockpit `INTERESTED_BOOK`)
**Where:** `/sales` → log **Interested — Book Meeting Now** with a future date/time on a QA-number lead.
**Should do:** `bookMeeting` creates a Google Calendar/Meet event, writes `leads.{meeting_link, follow_up_date, meeting_booked_at, gcal_event_id}` + `outreach_stage='meeting_booked'`, sends `meeting_confirmation` (3 params), queues `meeting_reminder_1h` + `meeting_reminder_15m`.
**Expect (UI):** lead appears as a card on `/admin/meetings` with date + Meet link.
**Verify (DB):**
```sql
select outreach_stage, meeting_booked_at, follow_up_date, meeting_link, gcal_event_id from leads where id='<lead_id>';
select template_name, fire_at, status from scheduled_messages where lead_id='<lead_id>';
select message_sent from whatsapp_logs where lead_id='<lead_id>' and message_sent like '%meeting_confirmation%' order by sent_at desc limit 1;
```
✅ Pass if: stage `meeting_booked`, `gcal_event_id` set (if Google creds configured), confirmation logged, two reminders queued.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-02 · Reschedule (admin card + public `/r/[leadId]`)
**Where:** `/admin/meetings` → **Reschedule** → new time. Then test the public page: open `/r/<lead_id>` → pick a time → **Confirm new time**.
**Should do:** update `leads.follow_up_date`/`meeting_link`; cancel + re-queue both reminders; resend `meeting_confirmation`.
**Verify (DB):**
```sql
select follow_up_date, meeting_link from leads where id='<lead_id>';
select template_name, fire_at, status from scheduled_messages where lead_id='<lead_id>' order by fire_at;
```
✅ Pass if: new time saved; old reminders `cancelled`, new ones `pending`.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-03 · No-show
**Where:** `/admin/meetings` card → **No Show**.
**Verify (DB):** `select outreach_stage, tags, last_outcome from leads where id='<lead_id>';` (stage `follow_up_due`, tag `no_show`), and `meeting_noshow` in `whatsapp_logs`.
⚠ KNOWN: this writes `outreach_stage` directly so `status` may not update in lockstep — expected.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-04 · Attended → Move to Proposals
**Where:** `/admin/meetings` card → **Attended** → **Interested** → **Confirm & Move to Proposals**.
**Verify (DB):** `select outreach_stage, status, meeting_notes from leads where id='<lead_id>';` (stage `proposal_sent`); lead now appears under "Awaiting Proposal" on `/admin/proposals`.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-05 · Create + send proposal
**Where:** `/admin/leads/[id]/proposal/new` → pick services + fees → **Preview** → **Save** → then **Send via FMOS WhatsApp**.
**Should do:** insert `proposals` (draft) → on send: `status='sent'`, lead → `proposal_sent`, queue `proposal_followup` (+48h), send `proposal_sent`.
**Verify (DB):**
```sql
select id, proposal_number, status, sent_at, total_setup, total_monthly from proposals where lead_id='<lead_id>' order by created_at desc limit 1;
select template_name, fire_at, status from scheduled_messages where lead_id='<lead_id>' and template_name='proposal_followup';
```
✅ Pass if: proposal `sent`, lead `proposal_sent`, followup queued, `proposal_sent` logged in `whatsapp_logs`.
⚠ KNOWN: the manual "open WhatsApp" link body contains a literal `[Attach PDF]` placeholder — attach the PDF by hand.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-06 · Send agreement
**Where:** `/admin/proposals` → on a **sent** proposal → **Send Agreement** (FileSignature icon).
**Should do:** insert `agreements` (status **`pending`**), send `agreement_sent` (4 params), cancel the pending `proposal_followup`.
**Verify (DB):**
```sql
select id, agreement_number, status, proposal_id from agreements where lead_id='<lead_id>' order by created_at desc limit 1;
select status from scheduled_messages where lead_id='<lead_id>' and template_name='proposal_followup';
```
✅ Pass if: agreement row exists with `status='pending'`, agreement appears Pending on `/admin/agreements`, followup `cancelled`.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-07 · Client confirms agreement ("Yes, confirmed")
**Where:** from the QA phone, reply **"Yes, confirmed"**.
**Should do:** `agreements.status='confirmed'`; lead → `outreach_stage='won'`; send `agreement_welcome`; admins notified.
**Verify (DB):**
```sql
select status, confirmed_at from agreements where lead_id='<lead_id>';
select outreach_stage, status from leads where id='<lead_id>';
select message_sent from whatsapp_logs where lead_id='<lead_id>' and message_sent like '%agreement_welcome%' order by sent_at desc limit 1;
```
✅ Pass if: agreement confirmed, lead won, welcome sent. ⚠ KNOWN: lead `status` is set to `active` directly here (drifts from the canonical `closed_won`) — expected.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-08 · Agreement manual confirm / void; public page
- `/admin/agreements/[id]` → **Mark as Confirmed** → `select status, confirmed_at from agreements where id='<id>';` ⚠ KNOWN: in-app confirm does NOT move the lead to won or send welcome (only the WhatsApp reply path does).
- `/admin/agreements` row → **Void** → `select status from agreements where id='<id>';` should be `cancelled`.
- Public `/a/<id>` renders the agreement; green banner once confirmed.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DEAL-09 · Proposal void / delete / edit
- Void a **sent** proposal → `select status from proposals where id='<id>';` → `rejected`.
- Delete a **draft** → row gone.
- Edit (pencil) reopens the creator pre-filled.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Finance: invoicing & payments

### FIN-01 · Create an invoice
**Where:** `/admin/finance/invoices` → **Create Invoice** → add line items → **Generate Invoice**.
**Verify (DB):**
```sql
select invoice_number, subtotal, gst_amount, total_amount, status, revenue_type from invoices order by created_at desc limit 1;
select description, amount, sort_order from invoice_line_items where invoice_id='<id>';
```
✅ Pass if: invoice + line items exist; `gst_amount ≈ subtotal*0.18`; `total_amount = subtotal + gst_amount`; `status='unpaid'`.
⚠ KNOWN: invoice number is a random `FM-{year}-{rand}` placeholder, not collision-checked.
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-02 · Record a full payment
**Where:** invoice row → green **Record payment** → enter full amount → method.
**Verify (DB):** `select status, paid_amount, total_amount, paid_at, payment_method from invoices where id='<id>';`
✅ Pass if: `paid_amount=total_amount`, `status='paid'`, `paid_at` set.
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-03 · Record a partial payment
**Where:** new invoice → **Record payment** → enter part of the total.
**Verify (DB):** `select status, paid_amount, total_amount from invoices where id='<id>';`
✅ Pass if: `status='partially_paid'`, `paid_amount` < `total_amount`.
⚠ KNOWN: the **public** `/inv/[id]` page only shows a "Partially Paid" badge when status is the string `partial`; finance-manager partials write `partially_paid`, so the public badge won't show for those. Documented mismatch — not a new bug.
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-04 · Generate MRR invoices (bulk)
**Where:** `/admin/finance/invoices` → **Generate MRR Invoices**.
**Verify (DB):**
```sql
select invoice_number, client_id, revenue_type, total_amount from invoices
where revenue_type='mrr' and issue_date >= date_trunc('month', now())::date;
```
✅ Pass if: one MRR invoice per active client with `monthly_value>0` not already billed this month; toast reports N generated / M skipped.
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-05 · Edit / cancel / delete invoice
- Edit a non-paid invoice → totals + line items update (`select total_amount from invoices where id='<id>';`). Paid invoices must be **blocked** from edit/delete.
- Cancel → `status='cancelled'`.
- Delete a non-paid invoice → row gone.
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-06 · Public invoice page + PDF download
- Open `/inv/<id>` → amounts render; bank details show when unpaid. ⚠ KNOWN: GSTIN footer reads `[Add GSTIN]` placeholder.
- Invoice row → **Download** → `{invoice_number}.pdf` downloads and opens.
- WhatsApp reminder icon → opens `wa.me` with a pre-filled message (no DB write — expected).
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-07 · Finance dashboard totals are real
**Where:** `/admin/finance`.
**Verify (DB):**
```sql
select revenue_type, sum(total_amount) from invoices
where status='paid' and created_at >= date_trunc('month', now()) group by revenue_type;
select sum(amount) from expenses where expense_date >= date_trunc('month', now())::date;
```
✅ Pass if: the MRR/Setup/One-Time and Expenses cards match these sums (this is the phantom-column regression guard — cards must NOT all be ₹0).
**Result:** ☐ PASS ☐ ISSUE: ________________

### FIN-08 · Expenses + GST report
- `/admin/finance/expenses` → **Log Expense** / edit / delete → `select expense_date, category, amount from expenses order by created_at desc limit 3;`
- `/admin/finance/gst` → quarterly tables populate from paid invoices' `gst_amount`. ⚠ KNOWN: input-GST (expense credit) is always 0 — `expenses` has no `gst_amount`; net payable = output GST only.
**Result:** ☐ PASS ☐ ISSUE: ________________

---

# TIER 1 — Core operations

## Clients & Onboarding

### CLIENT-01 · Generate onboarding tasks
**Where:** `/admin/clients/[id]` → Onboarding tab → pick services → **Generate Onboarding Tasks**.
**Verify (DB):**
```sql
select service_id, task, status from client_onboarding_tasks where client_id='<client_id>' order by service_id;
select asset_name, required, status from client_asset_vault where client_id='<client_id>';
```
✅ Pass if: task + asset rows seed per chosen service (+ GENERAL).
**Result:** ☐ PASS ☐ ISSUE: ________________

### CLIENT-02 · Advance tasks & assets
- Cycle a task ▶ Start → ✓ Done → `select status, completed_at from client_onboarding_tasks where id='<task_id>';` (`completed_at` set when DONE — note: this table uses `completed_at`).
- Mark a task Blocked → `status='BLOCKED'`.
- Advance an asset Requested → Received → Stored → `select asset_name, status from client_asset_vault where id='<asset_id>';`
- Add a custom task → row with `task_id like 'CUSTOM_%'`.
**Result:** ☐ PASS ☐ ISSUE: ________________

### CLIENT-03 · Activate client
**Where:** complete all tasks + store all required assets → **Activate Client** banner.
**Verify (DB):** `select status, onboarding_completed from clients where id='<client_id>';` → `active` / `true`.
**Result:** ☐ PASS ☐ ISSUE: ________________

### CLIENT-04 · Package & health & upsell
- Save package → `select * from client_packages where client_id='<client_id>';` (MRR shows on `/admin/clients`).
- Update health score → `select health_score, upsell_eligible from client_packages where client_id='<client_id>';` ⚠ KNOWN: header reads `clients.health_score`, modal writes `client_packages.health_score` — the two can disagree.
- Log upsell attempt → `select target_service, outcome from upsell_attempts where client_id='<client_id>' order by created_at desc limit 1;`
**Result:** ☐ PASS ☐ ISSUE: ________________

## Delivery & Tasks

### DELIV-01 · Delivery board: check off task + complete milestone
**Where:** `/admin/clients/[id]` → Projects → Delivery Plan → tick a task circle.
**Verify (DB):**
```sql
select status, completion_date, milestone_id from tasks where id='<task_id>';
select status, approval_date, client_notified_at from project_milestones where id='<ms_id>';
```
✅ Pass if: task `completed` + `completion_date` set; completing the last task flips the milestone to `approved` and (in live mode) sends `project_update`. In test mode `client_notified_at` may stay null — expected.
**Result:** ☐ PASS ☐ ISSUE: ________________

### DELIV-02 · Drive links + force-complete milestone
- Save Raw/Edited/Final links → `select drive_raw_url, drive_edited_url, drive_final_url from tasks where id='<task_id>';`
- Milestone **Complete** button → `select status, approval_date from project_milestones where id='<ms_id>';`
**Result:** ☐ PASS ☐ ISSUE: ________________

### DELIV-03 · Project dashboard tasks (`/projects/[id]`)
- Add / edit / delete a task → `select title, status, assigned_to from tasks where project_id='<project_id>';`
- Staff execution modal: Start → Submit → **Mark Complete** → `select status, completion_date, submission_notes from tasks where id='<task_id>';`
⚠ KNOWN: (1) the task-manager's assignee picker uses demo names, so assignee notifications may no-op; (2) marking "completed" via the task-manager dropdown does NOT stamp `completion_date` — only the Delivery board and the staff execution modal do. The "Notes for PM" box in the modal is cosmetic (not saved).
**Result:** ☐ PASS ☐ ISSUE: ________________

### DELIV-04 · Publish a client deliverable (the producer)
**Where:** `/projects/[id]` → **Client Deliverables** card → fill title/file → **Publish for review** (only shows if the project has a client).
**Verify (DB):** `select title, status, file_url from client_deliverables where project_id='<project_id>' order by created_at desc limit 1;` → `status='pending_review'`.
✅ Pass if: row created at `pending_review` and it appears in the client portal (PORTAL-01). This is the producer that makes the portal approve/revise flow live.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Client Portal

### PORTAL-01 · Approve / request revision
**Where:** log into `/client/dashboard` as the client (matched by `clients.primary_email`) → on a `pending_review` deliverable, click ✓ Approve, or ⚠ → enter feedback → Submit Revision.
**Verify (DB):**
```sql
select status, client_feedback, reviewed_at from client_deliverables where id='<id>';
```
✅ Pass if: status flips to `approved` (feedback null) or `revision_requested` (feedback saved); the PM gets a notification; the publisher list on `/projects/[id]` reflects it.
**Result:** ☐ PASS ☐ ISSUE: ________________

### PORTAL-02 · Dashboard shows real progress
**Where:** `/client/dashboard`.
**Verify (DB):** `select * from projects where client_id='<client_id>' and status in ('not_started','in_progress');` — progress %, roadmap, artifacts, reports should reflect this. ⚠ KNOWN: portal loads milestones/deliverables for the **first** in-progress project only.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Reports

### REPORT-01 · Synthesize AI summary
**Where:** `/admin/clients/[id]/reports/new` → pick a month → **Synthesize**.
**Expect:** textarea fills with an AI summary; toast "Summary drafted". (No DB write — it's a draft. Needs `ANTHROPIC_API_KEY`; otherwise an "AI Error" toast.)
**Result:** ☐ PASS ☐ ISSUE: ________________

### REPORT-02 · Save draft / publish report
- **Save Draft** → `select report_type, is_published, magic_link_token from client_reports where client_id='<client_id>' order by created_at desc limit 1;` → `is_published=false`.
- **Publish to Portal** (use **monthly**) → `is_published=true` and `magic_link_token` minted; appears in portal sidebar; opens at `/client/report/<token>`.
⚠ KNOWN: only **monthly** reports mint the magic-link token. A published **weekly/custom** report has `magic_link_token=null`, so its portal link is dead (`/client/report/null`). Documented gap.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Marketing

### MKT-01 · Import ad-spend CSV
**Where:** `/admin/marketing` → Inbound & Funnel → **Choose CSV** (Day/Campaign/Spend columns).
**Verify (DB):** `select date, campaign_id, spend, leads from ad_insights_daily order by created_at desc limit 10;` and `select campaign_name, platform from ad_campaigns order by created_at desc limit 5;`
✅ Pass if: day-rows inserted; new campaigns auto-created; Ad Spend KPI + CPL chart refresh.
**Result:** ☐ PASS ☐ ISSUE: ________________

### MKT-02 · Generate weekly AI brief
**Where:** Overview tab → **Generate New Brief**.
**Verify (DB):** `select week_start_date, summary_text, leads_delta, generated_by from marketing_weekly_briefs order by week_start_date desc limit 1;`
✅ Pass if: a real brief row is inserted with an AI summary (needs `ANTHROPIC_API_KEY`).
**Result:** ☐ PASS ☐ ISSUE: ________________

### MKT-03 · Campaigns / keywords / content / UTM
- Add campaign + inline-edit spend → `select campaign_name, monthly_budget, spend_mtd from ad_campaigns order by created_at desc limit 3;` ⚠ KNOWN: inline spend edit shows no error toast on failure.
- Add SEO keyword → `select keyword, belongs_to, notes from seo_keywords order by created_at desc limit 3;` ⚠ KNOWN: keywords added here have `belongs_to=null` and won't appear in the Growth SEO tab (which filters `belongs_to='agency'`).
- New content piece → `select title, content_type, status from content_pieces order by created_at desc limit 3;`
- UTM builder → copies a link (no DB write — expected).
**Result:** ☐ PASS ☐ ISSUE: ________________

### MKT-04 · Inbound funnel & hub are real
**Where:** Inbound & Funnel tab + `/admin/marketing-hub`.
**Verify (DB):** `select channel, status, lead_id, created_at from inbound_events order by created_at desc limit 10;` — the funnel/scoreboard/recent-events should reflect live leads + spend.
⚠ KNOWN placeholders (not bugs): Organic SEO stats bar + traffic chart ("GSC not connected"), 7D/30D/90D pills, "Top Creative" card, overview CPL/spend deltas at 0%.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Growth

### GROW-01 · Create/edit content post
**Where:** `/admin/growth` channel page → **Create Post** → Save (and try Kanban drag).
**Verify (DB):** `select id, channel, status, title, cta_type, updated_at from content_pieces order by updated_at desc limit 3;`
**Result:** ☐ PASS ☐ ISSUE: ________________

### GROW-02 · Growth task checkbox persists
**Where:** `/admin/growth?tab=organic` → tick a pending task.
**Verify (DB):** `select id, status, completion_date from tasks where id='<task_id>';` → `completed` + `completion_date` set (not local-only).
**Result:** ☐ PASS ☐ ISSUE: ________________

### GROW-03 · GMB metrics / checklist / review requests / target cities
- Save GMB snapshot → `select * from gmb_snapshots order by snapshot_month desc limit 1;`
- Toggle a GMB checklist item → `select is_completed, completed_at from gmb_checklist_items where id='<id>';`
- Log a review request + mark received → `select review_received, rating from review_requests order by requested_at desc limit 3;`
- Add target city / toggle niche → `select city, niche, is_active from acquisition_targets order by city;`
⚠ KNOWN: IG/FB/LI follower/profile-visit counts are honest "—" placeholders (no social API); Posts/Engagement are real from `content_pieces`. Several growth writes have no error toast (silent on failure).
**Result:** ☐ PASS ☐ ISSUE: ________________

## Strategy

### STRAT-01 · Generate + approve strategy tasks
**Where:** `/admin/strategy` → paste strategy text → **Generate Tasks** → review → **Approve & Save Tasks**.
**Verify (DB):**
```sql
select r.id, r.tasks_generated, count(t.id) as tasks, count(srt.task_id) as links
from strategy_runs r
left join tasks t on t.strategy_run_id=r.id
left join strategy_run_tasks srt on srt.strategy_run_id=r.id
group by r.id order by r.created_at desc limit 1;
```
✅ Pass if: a `strategy_runs` row + one `tasks` row per approved item + matching `strategy_run_tasks` links; tasks show in `/tasks` and the run in `/admin/strategy/archive`. (Generate needs `ANTHROPIC_API_KEY`; the Generate step itself writes nothing until Approve.)
**Result:** ☐ PASS ☐ ISSUE: ________________

## Automations

### AUTO-01 · Create / edit / delete / toggle a rule
**Where:** `/admin/automations` → **New Rule** (trigger + conditions + a `send_whatsapp` action using a template from the picker) → save → **Configure** (edit) → **Activate** → **Delete**.
**Verify (DB):**
```sql
select id, name, trigger, entity_type, is_enabled, actions, conditions from automation_rules order by created_at desc limit 3;
```
✅ Pass if: rule persists with your conditions/actions JSON; new rules default **Paused**; the template picker only offers approved Meta handles; delete removes it (and its `automation_runs` first).
**Result:** ☐ PASS ☐ ISSUE: ________________

### AUTO-02 · Rule actually fires
**Where:** enable a rule whose trigger you can cause (e.g. `lead_outcome_logged` via a cockpit outcome, or run `curl -X POST $BASE_URL/api/cron/automations/followups -H "Authorization: Bearer $CRON_SECRET"`).
**Verify (DB):** `select rule_id, status, trigger, entity_id, created_at from automation_runs order by created_at desc limit 10;`
✅ Pass if: an `automation_runs` row appears for your rule (no UI list exists — SQL only). ⚠ Inert until a matching rule is enabled and the trigger name matches exactly.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Direct Report

### WA-DR-01 · Direct Report test send + tracking
**Where:** `/admin/direct-report` → **Send test** to a QA number (do NOT use "Send reports" against real leads).
**Verify (DB):**
```sql
select message_sent, delivery_status from whatsapp_logs where message_sent like '%direct_report%' order by sent_at desc limit 5;
```
✅ Pass if: a `direct_report_type_*` send is logged with a document header; tracking page `/admin/direct-report/tracking` shows the Sent→Delivered→Read funnel. ⚠ Inert until `report_assets` is seeded + Cloud-API creds set.
**Result:** ☐ PASS ☐ ISSUE: ________________

## Team

### TEAM-01 · Targets + progress + scorecards
- **Set Targets** → `select user_id, target_type, target_value from team_targets order by user_id;` (writes `daily_*` + `weekly_*` rows).
- Targets progress (calls) reads `outreach_logs`: `select actor_id, count(*) from outreach_logs where touch_type='call' and created_at >= current_date group by actor_id;`
- `/admin/team/scorecards` → real per-user numbers (calls/tasks/projects/proposals). ⚠ revenue/sites/demos are intentionally "Not tracked".
**Result:** ☐ PASS ☐ ISSUE: ________________

### TEAM-02 · Member management
**Where:** `/admin/team` member menu → Add / change Role / Reset Password / Deactivate / Remove.
**Verify (DB):** `select id, email, role, is_active from profiles where id='<id>';`
✅ Pass if: role/`is_active` reflect your action; self-demotion/deactivation is blocked.
**Result:** ☐ PASS ☐ ISSUE: ________________

### TEAM-03 · SOP library
Create / edit / delete an SOP → `select id, title, category from sops order by created_at desc limit 3;`
**Result:** ☐ PASS ☐ ISSUE: ________________

---

# TIER 2 — Supporting, analytics & admin

### OPS-01 · Users page status & role
**Where:** `/admin/users` → change a role dropdown.
**Verify (DB):** `select role, is_active from profiles where id='<id>';` ✅ status pill reflects `is_active` (shows "Inactive" only when `is_active=false`).
**Result:** ☐ PASS ☐ ISSUE: ________________

### OPS-02 · Sessions
**Where:** `/admin/sessions` → list, filters, **Export CSV**.
**Verify (DB):** `select user_id, login_at, last_seen_at, logout_at from user_sessions order by last_seen_at desc limit 20;`
⚠ KNOWN: there is **no revoke / force-logout** action — sessions end only via cron/logout. Don't log its absence as a bug.
**Result:** ☐ PASS ☐ ISSUE: ________________

### OPS-03 · Business settings
**Where:** `/admin/settings` → edit GSTIN / bank / invoice prefix → Save.
**Verify (DB):** `select gstin, gst_rate, invoice_prefix, bank_name from business_settings limit 1;` (these feed invoice PDFs + GST report).
**Result:** ☐ PASS ☐ ISSUE: ________________

### OPS-04 · Inbound webhook capture
**Where:** ask the team to POST a test payload:
`curl -X POST $BASE_URL/api/inbound/test -H "Authorization: Bearer $INBOUND_WEBHOOK_SECRET" -H "Content-Type: application/json" -d '{"name":"Webhook Test","phone":"<QA number>","source":"test"}'`
**Verify (DB):**
```sql
select channel, status, lead_id, created_at from inbound_events order by created_at desc limit 5;
select company_name, source, lead_source from leads where id='<lead_id>';
```
✅ Pass if: an `inbound_events` row + a new lead + the lead shows in the cockpit and the Marketing "Recent Inbound Events". (GET to the same URL returns a handshake `{ok:true}`; missing secret = 401.)
**Result:** ☐ PASS ☐ ISSUE: ________________

### INSIGHT-01 · Market insights (keyword ingest → SERP → PDFs)
- Keyword CSV ingest → `select industry, city, search_volume, jsonb_array_length(general_insights->'topKeywords') from market_insights;`
- **Scan SERP** on a row → `select industry, city, competitor_insights->'buckets' from market_insights where competitor_insights ? 'buckets';` ⚠ KNOWN: needs `SEARCHAPI_IO_KEY` (likely unset → errors gracefully). Also note the page is now hardened against legacy rows lacking `buckets` (the crash fixed on 2026-06-19) — the page should load even with mixed data.
- **PDFs** on a row → `select city, niche_slug, lead_type, lang, public_url from report_assets where city='<X>';`
**Result:** ☐ PASS ☐ ISSUE: ________________

### DUP-01 · Duplicate scan, ignore, merge, undo
- `/admin/duplicates` → **Run Scan Now** → `select match_type, count(*) from duplicate_candidates where status='open' group by 1;`
- **Ignore** a candidate → `select status from duplicate_candidates where id='<id>';` → `ignored`.
- **Merge** via wizard → `select is_merged, merged_into from leads where id in ('<merged>','<survivor>');` and `select moved_children, undo_until, is_undone from merges where merged_id='<merged>';` (child rows like `outreach_logs` should now point to the survivor; a `lead_redirects` row exists).
- **Undo** (API only): `curl -X POST $BASE_URL/api/leads/merge/undo -H "Content-Type: application/json" -d '{"merge_id":"<id>"}'` → `select is_undone from merges where id='<id>';` ⚠ KNOWN: no UI button for undo; undo restores child rows but not survivor field overwrites.
**Result:** ☐ PASS ☐ ISSUE: ________________

### IMPORT-01 · CSV upload + history
- `/admin/upload` → import a CSV → `select count(*) from leads where import_batch_id='<batch>';` and `select * from csv_uploads order by created_at desc limit 1;`
- `/admin/upload/history` → **View Leads**. ⚠ KNOWN: the `?batch=` link lands unfiltered; `/admin/bulk-import` just redirects to `/admin/upload` (its `runBulkImport` action is dead). CSV `contact_person` is dropped on import.
**Result:** ☐ PASS ☐ ISSUE: ________________

### ATT-01 · Attendance clock in / out / break
**Where:** `/attendance` → Clock In → Break → Resume → Clock Out (confirm modal).
**Verify (DB):**
```sql
select status, clock_in_at, clock_out_at from attendance_sessions where user_id='<uid>' order by clock_in_at desc limit 1;
select break_start_at, break_end_at from attendance_breaks where session_id='<id>' order by break_start_at desc;
```
✅ Pass if: ring states match (Working/On Break/Clocked Out) and rows reflect each action. Errors (e.g. double clock-in) surface as a toast — confirm the toast appears.
**Result:** ☐ PASS ☐ ISSUE: ________________

### ANALYTICS-01 · Read-only dashboards
- `/admin/sales` funnel/leaderboard → `select outcome, count(*) from outreach_logs group by outcome;` ⚠ KNOWN: "Sessions Booked" KPI uses `leads.status`, may undercount; the Telecaller Leaderboard block is gated off; `?batch=` ignored.
- `/telecaller/my-stats` → `select count(*) from outreach_logs where actor_id='<uid>' and touch_type='call' and created_at::date=current_date;` should match "Calls today".
- `/manager/performance` → real computed data.
**Result:** ☐ PASS ☐ ISSUE: ________________

### LEGACY-01 · Old pitch caller (`/sales/pitch/[industry]/[city]`) — verify divergence
**Where:** open a pitch page → green call button → pick an outcome.
**Verify (DB):** `select outreach_stage, next_action_date from leads where id='<lead_id>';` AND `select * from call_activities where lead_id='<lead_id>' order by created_at desc limit 1;`
⚠ KNOWN: this legacy path logs to **`call_activities`**, NOT `outreach_logs`, so these calls are **invisible** to `/admin/sales` and `/telecaller/my-stats`. Use the main cockpit (SALES-01) as the canonical path. Confirm you understand the divergence.
**Result:** ☐ PASS ☐ ISSUE: ________________

---

## Appendix A — Known limitations (verify, don't re-raise)

These are documented behaviors found during the 2026-06-19 audit. They're either by-design or low-priority and already known. Confirm them so the behavior makes sense; only log an issue if it behaves **differently** than described here.

1. **PDF Log columns blank** (`/admin/outreach/pdf-log`): Lead/Niche/City/Sent-By/Stage show "—" and filter dropdowns are empty (query omits joins). Rows still appear.
2. **Partial-payment status string mismatch:** finance manager writes `partially_paid`; the public `/inv` page only badges `partial`.
3. **Public invoice GSTIN** is a literal `[Add GSTIN]` placeholder.
4. **GST input credit** always 0 (no `expenses.gst_amount`).
5. **Two completion-timestamp columns:** `tasks.completion_date` vs `client_onboarding_tasks.completed_at`. Marking a task complete from the project task-manager dropdown does not stamp `completion_date` (only the Delivery board + staff modal do).
6. **Two deliverable tables:** internal `deliverables` vs client-facing `client_deliverables`.
7. **Health score** lives in two columns (`clients.health_score` header vs `client_packages.health_score` modal/list).
8. **Report magic-link** minted only for **monthly** reports; weekly/custom published reports have a dead portal link.
9. **Marketing keywords** added in `/admin/marketing` have `belongs_to=null` → invisible in Growth's SEO tab.
10. **Marketing placeholders:** Organic SEO stats/traffic ("GSC not connected"), 7D/30D/90D pills, "Top Creative", CPL/spend deltas at 0%.
11. **Growth social follower counts** are honest "—" (no social API); Posts/Engagement are real.
12. **No-show & agreement-confirm-webhook** write `outreach_stage` directly → `leads.status` can drift.
13. **In-app agreement confirm** doesn't move the lead to won / send welcome (only the WhatsApp "Yes, confirmed" reply does).
14. **Legacy pitch caller** logs to `call_activities` (invisible to analytics).
15. **Merge undo** is API-only (no button) and doesn't restore overwritten survivor fields.
16. **`/admin/sales` `?batch=` and upload-history "View Leads"** don't filter; `/admin/bulk-import` is a redirect stub.
17. **No session revoke** control.
18. **Two SLA crons** exist; only `/api/cron/automations/sla` is scheduled (`/api/cron/sla` is redundant). **`whatsapp-quality` cron** isn't in the schedule (realtime webhook only).
19. **Silent awaits** (no error toast) on: marketing inline spend edit, several growth writes (Kanban drop, review received, niche toggle).
20. **Env-gated:** SERP scan (`SEARCHAPI_IO_KEY`), AI brief/strategy/synthesize (`ANTHROPIC_API_KEY`), crons (`CRON_SECRET`), inbound (`INBOUND_WEBHOOK_SECRET`), WhatsApp webhook (`META_APP_SECRET` + Cloud-API token).

---

## Appendix B — Issue Log

Record anything that behaves differently than this guide says.

| # | Test ID | What you did | What you saw | What you expected | Severity (P0/P1/P2) | SQL/screenshot |
|---|---------|--------------|--------------|-------------------|---------------------|----------------|
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |

---

## Suggested test order (one pass)

1. **Tier 0 sales + WhatsApp** (SALES-01..07, WA-01..09) — the daily driver.
2. **Tier 0 deals** (DEAL-01..09) — book → proposal → agreement → won, end to end on one QA lead.
3. **Tier 0 finance** (FIN-01..08).
4. **Tier 1** clients → delivery → portal → reports → marketing → growth → strategy → automations → direct report → team.
5. **Tier 2** ops/analytics/insights/dedup/import/attendance/legacy.

Do Tier 0 against **one disposable QA-number lead** so you can watch a single record travel the whole pipeline and confirm each arrow in `FMOS_APP_WORKFLOW.md` §2 actually fires.
