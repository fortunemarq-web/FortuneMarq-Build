# FMOS — Future Features Backlog
**Everything we've decided to build LATER, parked here so we don't lose it or get distracted.**
**Last updated:** 2026-06-15

> Rule: the main goal is **land clients** (finish → connect → deploy → acquire). New ideas go in
> this list, NOT built mid-stream, unless they directly unblock the main goal.

Legend: 🟢 no schema change (safe anytime) · 🔵 needs SQL (fine now — `proxy.ts` is fail-open) · 🌐 needs external account/API

---

## A. AI Assistant (Jabeer's request — Phase 1 already built)
- ✅ Phase 1 — Daily AI report to admin WhatsApp (DONE; needs Meta template + numbers to activate)
- 🟢🔵 **Phase 2 — In-app chat assistant** — role-scoped Q&A + summaries, answers by querying real data (tool-use), telecaller can't see finance. (Chat history persistence = 🔵 small table.)
- 🔵 **Phase 3 — Weekly strategy suggestions** — analyse real outcomes → suggest, feeding the Strategy Engine.

## B. Feedback-loop layer (from the systems review)
- 🟢 **SLA escalation rules** — create `/admin/automations` rules for `lead_sla_missed` / `lead_followup_due` → notify. (Cron already scheduled; just needs the rules.)
- 🟢 **Delivery-quality → Sales signal** — partly done (Delivery Load dashboard). Extend: warn Sales when a service type is slow/over-capacity.
- 🔵 **Channel → LTV view** — join client MRR (`client_packages.monthly_value`) back through `agreements.lead_id` → lead source. Answers "which channel produces the best clients, not the cheapest leads."
- 🔵 **Client health score (real-time)** — composite from invoice timeliness + task completion + renewal proximity.
- 🔵 **Capacity model** — configurable build-hours per builder per service; turn the Delivery Load "Overloaded" heuristic into real capacity.

## C. Onboarding (Phase 2 deferred halves)
- 🔵 **Structured intake form** — typed fields the client fills directly (vs collected as assets).
- 🔵 **Owner → real-user wiring** — onboarding tasks land in Zaid/Sufiyan's `/tasks` + feed scorecards (today owners are text labels).

## D. Sales / delivery polish
- 🟢 **Lead scoring refinement** — add the `noContactIn7Days` factor once `last_activity_at` is in the cockpit query.
- 🟢 **Outbound WhatsApp send UI** — `lib/whatsapp/send.ts` is ready; add a "Send via WhatsApp" button in the cockpit (template + lead params) and on agreements.
- 🔵🌐 **Real PDF for proposals + agreements** — invoices already use `@react-pdf/renderer`; mirror for proposals/agreements + upload to storage → WhatsApp document send.
- 🟢 **Portal request → Task** — let clients raise a request/question on `/client/dashboard` that creates a Task (the deliverable revision loop already proves the pattern).

## E. Marketing M3 — connect external data (mostly 🌐)
- 🌐 **Google Search Console + Analytics** — real organic traffic/keywords (Organic SEO tab currently honest placeholder).
- 🌐 **Meta + Google Ads APIs** — live ad spend/results (today: CSV import bridge).
- 🌐 **Social reach/follower APIs** — IG/LinkedIn/FB/GMB metrics (today: manual entry).
- 🌐 **Meta Lead Ads + Google lead-form webhooks** — activate post-deploy (code built) once running paid ads.

## F. Org / business (FMOS can support, not solve)
- **Strategist role staffing + handoff workflow** — make proposals/meetings/agreements assignable to a strategist, not admin-only, so Phase D/E work comes off Jabeer.

## G. From the earlier industry-grade audit (lower priority)
- Pipeline velocity dashboard (avg days per stage, bottlenecks)
- Deal probability % on proposals
- Bulk WhatsApp broadcast to a filtered segment
- Live team leaderboard
- Inbound lead speed-to-lead live alerts (overlaps with B/SLA)
- Bulk lead import validation hardening

---

## Priority when we return to building (after deploy + first clients)
1. AI Phase 2 (in-app chat) — Jabeer wants it, high daily value
2. SLA escalation rules + Channel→LTV view — cheap, high-leverage feedback loops
3. Outbound WhatsApp UI + real PDFs — sales polish
4. Onboarding structured form + owner wiring
5. Everything else as needed
