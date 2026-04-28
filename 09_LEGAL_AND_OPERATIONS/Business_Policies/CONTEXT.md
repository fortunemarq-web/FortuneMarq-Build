# 09 — Business Policies
**Last Updated:** 2026-04-28 | **Status:** COMPLETE — payment and cancellation policy written and locked

## Folder Purpose
Store all business policies that govern how FortuneMarq operates with clients — payment terms, cancellation, overdue escalation, and asset handover.

## What Exists (Complete)

| File | Description |
|---|---|
| `payment_and_cancellation_policy.md` | Full payment and cancellation policy document: invoice schedule, accepted payment methods, overdue escalation flow, setup fee rules, cancellation terms, asset handover on exit |
| `CONTEXT.md` | This file |

## Payment Policy Summary
- **Invoice schedule:** Raised 1st of month, due by 5th
- **Accepted methods:** Bank transfer, UPI (Google Pay / PhonePe), Cash (office only with receipt)
- **Setup fees:** Due before work begins — no exceptions
- **7 days overdue:** All Google Ads and Meta Ads campaigns paused. Client notified via WhatsApp on day of pausing.
- **30 days overdue:** Client's website taken offline. Client notified 3 days before this happens.
- **Service resumption:** Paused services resume same day payment confirmed. No reinstatement fee.

## Cancellation Policy Summary
- **Exit notice:** 30 days written notice via WhatsApp or email (either party can exit)
- **Setup fees:** Non-refundable once work has started
- **Monthly fees:** Pro-rated to the cancellation date
- **Outstanding amounts:** Must be settled within 7 days of exit date
- **Asset handover:** All logins, accounts, and assets handed over to client on exit. FMOS access revoked. Hosting and domains reverted to client control.

## What's Pending
- None. Policy is locked and ready to use.
- Privacy Policy still pending (separate document needed for website)

## What's Blocked
- Nothing.

## Connections to Other Folders
- **Referenced in:** `09_LEGAL_AND_OPERATIONS/Agreement_Templates/service_terms.json` — universal terms section
- **Referenced in:** `03_SALES_SYSTEM/Proposals/FMOS_Proposal_Data/proposal_schema.json` — Page 5 payment terms
- **Applied by FMOS:** Invoice overdue logic in `01_CRM_AND_TOOL/fmos/app/api/cron/automations/`

## Key Decisions Made (Locked)
- No grace period beyond 7 days for ads pause — this is firm
- 30-day website offline warning is mandatory (3-day notice before action)
- Pro-rated monthly fees on cancellation — not a full month charge
- No exceptions to setup-fee-before-work rule

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Policy framework defined. |
| 2026-04-02 | payment_and_cancellation_policy.md written and finalized. |
| 2026-04-28 | CONTEXT.md fully rewritten. |
