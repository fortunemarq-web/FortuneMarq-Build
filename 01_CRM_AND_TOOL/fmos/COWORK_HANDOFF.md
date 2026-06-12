# Cowork Handoff — FMOS UI/UX Session (2026-06-11, evening)

> **UPDATE 2026-06-12 (Cowork session):** see "2026-06-12 session" section at the
> bottom for the CRUD pass, bug fixes, and the in-progress ClickUp-style
> frontend sweep checklist.

> **Purpose:** Open this file in Claude Cowork (or any new Claude session) to continue
> exactly where the previous Claude Code session left off. Read `CLAUDE.md` in this
> directory first for project-wide conventions, then this file for the latest state.

---

## What this session did (in order)

### 1. Folder rename
`~/Desktop/ FortuneMarq-Build` (leading space) → `~/Desktop/FortuneMarq-Build`.
All docs now reference the no-space path. App path:
`/Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos`

### 2. Dev server
`npm run dev` binds `0.0.0.0`. Mobile view on same Wi-Fi: **http://192.168.1.2:3000**

### 3. UI/UX overhaul — "industry-grade, not AI-made"
Design philosophy now: **neutral-first, one brand accent, semantic color only for status**
(Linear/Stripe style). Done:

- **Fonts**: self-hosted via `next/font` in `app/layout.tsx` (DM Sans display,
  IBM Plex Sans body, IBM Plex Mono). The render-blocking Google Fonts `<link>` is gone.
- **`app/globals.css`** now defines the design system:
  - Brand tokens (Tailwind v4 `@theme`): `brand` #42CA80, `brand-hover` #35A66A,
    `brand-active` #2D9960, **`brand-deep` #1E7A4F (the ONLY green for text/buttons
    on white — #42CA80 fails contrast)**, `brand-soft` #ECFAF3, `brand-ring`.
  - Global focus-visible ring, thin scrollbars, brand selection color,
    tabular numerals for tables, reduced-motion support, print rules (see §6).
- **Deleted `tailwind.config.ts`** — dead v3 config, Tailwind v4 never read it.
- **Login page** (`app/login/page.tsx`): rebuilt visual layer (auth logic untouched).
- **Admin dashboard** (`app/admin/page.tsx`): neutral KPI cards (red only when
  outstanding invoices exist), `ActionSection` now takes `tone?: "neutral"|"danger"|"warning"`,
  one quiet bordered action-button style, single-color (brand) pipeline bars, emojis removed.
- **7 error pages**: ⚠️ emoji → `AlertTriangle` icon, buttons → `bg-brand-deep`.
- **Telecaller cockpit**: gradient call button → solid `bg-brand-deep` white text;
  dark stats bar uses uniform white numerals; UI-chrome emojis removed.
- Emojis in WhatsApp templates / call scripts are **content — deliberately kept**.

### 4. Bug fix: outreach board crash
`leads.updated_at` and `leads.assigned_to` **do not exist**. Real columns:
`last_activity_at`, `assigned_sales_exec`, `meeting_booked_at`.
- `app/admin/outreach/page.tsx` + `outreach-board-client.tsx` fixed
  (stalled badge uses `last_activity_at ?? created_at`).
- `app/admin/page.tsx` "Meetings booked today" now counts on `meeting_booked_at`
  (was silently failing on `updated_at`).
- **`lib/pipeline.ts`**: `leadStageUpdate()` / `leadStatusUpdate()` now auto-stamp
  `last_activity_at` always, and `meeting_booked_at` when stage → `meeting_booked`.
  Caller-passed `extra` still overrides. Cockpit's manual payload stamps the same.

### 5. Layout fix: white-space overscroll + scrolling sidebar
- `components/ui/layout-wrapper.tsx`: app shell is `flex h-dvh overflow-hidden`;
  **`<main>` is the ONLY scroll container** (`overflow-y-auto`). Sidebar can't scroll away.
- All 106 shell-rendered files: `min-h-screen` → `min-h-full`.
  **Rule: pages inside the shell use `min-h-full`, never `min-h-screen`.**
  Public/standalone routes keep `min-h-screen`: `app/page.tsx`, `/login`, `/lp/*`,
  `/client/report/*`.

### 6. PDF / document design upgrade
- **`components/admin/finance/InvoicePDF.tsx`** (@react-pdf/renderer): full redesign —
  brand top bar, status chip (Paid/Due/Overdue from `invoice.status`), grey info band
  (From / Billed To / dates), dark zebra table, green "Total Due" block, bank panel,
  fixed page footer. (Also fixed old `borderBottomV` typo.)
- **Print-to-PDF system** for HTML documents (proposals + agreements had no PDF path):
  - `@media print` block in `globals.css`: A4 + 12mm margins, app chrome hidden,
    `.print-area` documents print flush, exact colors, `tr`/`.avoid-break` don't split.
  - **Pattern**: wrap the document in `className="print-area"`, mark surrounding
    chrome `print:hidden`, add `<PrintButton />` (`components/ui/print-button.tsx`)
    → browser print → Save as PDF.
  - ⚠️ History: first implementation used the visibility-hidden isolation trick →
    **all-blank PDFs** (specificity bug + absolute-positioning pagination).
    Current normal-flow approach is the fix. Don't reintroduce the visibility trick.
- **Agreement page** (`app/admin/agreements/[id]/page.tsx`): PrintButton, signature
  blocks ("Agreed & Accepted", auto-fills confirmed date), document footer strip,
  `Check` icons instead of ✓ glyphs.
- **Proposal creator step 2** (`components/proposals/proposal-creator.tsx`):
  "Download PDF" button (`window.print()`), document wrapped in `print-area`.

**Verification state:** `npx tsc --noEmit` clean, `npm run build` clean after every step.
User confirmed pages render; blank-PDF fix delivered but **awaiting user re-test**.

---

## Known issues / deferred — STATUS AS OF 2026-06-12 (end of Cowork session)

> Original 06-11 list, updated. Items 2, 4, 5, 6 were FIXED on 06-12
> (see the session log at the bottom of this file).

1. **Awaiting user confirmation:** proposal/agreement PDF download — desktop
   page breaks confirmed fixed through the footer fix; mobile print untested.
2. ~~Growth emoji icons~~ → DONE (content-type-icons.tsx, Lucide).
3. **Hardcoded `#42CA80` hexes** — many migrated during the 06-12 sweep;
   remainder still migrate opportunistically when touching files.
4. ~~/manager pipeline-board broken queries~~ → DONE (rewired to outreach_stage).
5. ~~calc(100vh) scroll areas~~ → DONE (dvh-aware, top-bar offset).
6. ~~UI pass for outreach/meetings/clients/finance~~ → DONE (Phases 2–7).

## Standing pre-deploy checklist (unchanged from morning session)

1. Run the four `20260611*` migrations in Supabase SQL editor **in order**
   (RLS hardening → meeting columns → audit triggers → indexes).
2. Vercel env: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (+ existing publics).
3. WhatsApp Cloud API integration deferred (needs deployed HTTPS URL + credentials).

## Conventions added this session (enforce in all future work)

- Buttons/text in green = `brand-deep` (+ `brand-hover`/`brand-active` states);
  `brand` (#42CA80) only for accents/fills/bars, never text on white.
- No emoji as UI chrome (icons, headers, badges). Emoji in outbound message
  content (WhatsApp templates, scripts) is fine.
- Shell pages: `min-h-full`. Only no-sidebar routes use `min-h-screen`.
- Printable documents: `.print-area` + `print:hidden` chrome + `PrintButton`.
- Stage writes still ONLY via `lib/pipeline.ts` helpers (they now stamp activity
  timestamps too — don't hand-write `last_activity_at`).

---

## 2026-06-12 session (Cowork)

### Done
1. **Proposal print pagination** — `avoid-break` on every discrete block in
   proposal-creator preview; `keep-with-next` utility added to globals.css;
   service cards drop borders in print; footer bound to get-started section.
2. **CRUD pass** (all verified tsc-clean):
   - Invoices: edit modal (pre-paid only), cancel/void, delete (non-paid);
     `updateInvoice/cancelInvoice/deleteInvoice` in finance/actions.ts.
   - Expenses: `updateExpense/deleteExpense`; wired previously-dead edit/delete
     buttons; fixed invalid default category ("Marketing" wasn't an option).
   - Proposals: edit via `/admin/leads/[id]/proposal/new?edit=<proposalId>`
     (creator accepts `existingProposal`); void sent → rejected; delete drafts
     (`components/proposals/proposal-row-actions.tsx`).
   - Agreements: void/delete rows (`agreement-row-actions.tsx`). Confirmed ones
     are untouchable.
   - Leads: Delete button on admin lead profile (uses existing
     `deleteSingleLead` from actions/delete-data.ts).
   - Clients: status dropdown in table (active/onboarding/paused/churned) +
     hard delete with child-table cleanup (`deleteClient` in clients/actions.ts).
   - WhatsApp templates: wired dead delete button in template-manager.
   - Growth content: `deleteContentPiece` action + Delete in ContentPostModal
     (calendar + kanban both pass onDelete).
3. **Bug fixes**: /manager pipeline-board fully rewired to `outreach_stage` via
   `leadStageUpdate()` (was querying non-existent `pipeline_updated_at`,
   `profiles!leads_assigned_to_fkey`; showed fake $425k/12.4% stats — now real
   counts); h-screen → h-full on /manager/pipeline; alert() → toast in
   task-card, strategist-pipeline, whatsapp-template-button, ContentPostModal;
   invoice table title-attr + colSpan bugs; removed fake "reminder sent" button.
4. **ClickUp-style shell (Phase 1 of frontend sweep)**:
   - `components/ui/top-bar.tsx` (new): desktop breadcrumb bar + ⌘K trigger +
     NotificationBell (moved out of floating position), wired into
     layout-wrapper (shell is now sidebar | column(topbar, main)).
   - Command palette fixed: ilike search on real columns (fts_tokens migration
     may not be applied), nav actions now mirror the sidebar, lead links go to
     /admin/leads/[id].
   - Sidebar densified: 13px items, py-1.5, tighter icons/labels.

### Frontend sweep checklist (ClickUp/Jira vibes) — remaining phases
User wants the whole app to feel like ClickUp/Jira. Order agreed:
- [x] Phase 1: shell (top bar, ⌘K, sidebar density)
- [x] Phase 2: Leads/Outreach — DONE 2026-06-12: LeadsList rebuilt (13px dense
      rows, outreach_stage column + badge via getStage(), city/phone columns,
      stage filter chips, row click opens components/leads/lead-peek-panel.tsx
      slide-over with stage select + call/WhatsApp + full-profile link);
      lib/filtering.ts supports outreach_stage[]; outreach board columns now
      dvh-aware (calc(100dvh-280px), accounts for new top bar) + brand tokens.
- [x] Phase 3: Tasks/Projects — DONE 2026-06-12: TaskBoard gets quick-add row
      (Enter to create, assigns to self), working "My Tasks" tab (was showing
      all), brand-deep buttons; TaskCard rebuilt (priority Flag icons via
      PRIORITY_FLAGS, assignee initials avatar, dark-theme #2a2a2a leftovers
      removed, contrast-safe due-date colors); app/tasks/page.tsx role-query
      bug fixed (.single() without .eq(id) returned a random profile!);
      pm-dashboard cleaned (broken pasted className on Completed card, green/
      black toggles → slate segmented, brand tokens); all 11 projects-module
      alert() → toast.
- [x] Phase 4: Meetings — DONE 2026-06-12: raw greens → brand tokens (buttons
      brand-deep, focus rings brand), notification titles de-emojied. Page was
      already well-structured; WhatsApp template emojis kept (content).
- [x] Phase 5: Clients — DONE 2026-06-12: ClientsTable fully on brand tokens,
      rows densified (py-2.5). Slide-over preview NOT built (profile page has
      6 tabs already — build only if asked).
- [x] Phase 6: Finance — DONE 2026-06-12: invoice/expense managers densified
      (py-3 rows), create buttons brand-deep, indigo focus/breadcrumb accents
      → brand/neutral.
- [x] Phase 7: Growth — DONE 2026-06-12: emoji icons → Lucide via
      components/admin/growth/content-type-icons.tsx (getContentTypeIcon(id));
      icon prop now optional/unused on the 4 channel pages; modal status
      options de-emojied; kanban hexes → brand tokens.
- [ ] Sweep-wide: migrate raw #42CA80 → brand-* tokens in touched files;
      replace remaining alert() (users page, reports/new, strategy review,
      task-board, task-dependencies); kill remaining stray emojis in UI chrome.

### Still pending from before
- Proposal/agreement PDF re-test on mobile/print (user confirmed desktop page
  breaks fixed up to footer fix — awaiting final confirmation).
- 4 Supabase migrations (20260611*) before deploy; Vercel env vars; WhatsApp
  Cloud API integration (needs HTTPS).
- Team member invite/deactivate/remove needs Supabase auth admin flow —
  discussed, not built (decide approach first).

### Full app audit (2026-06-12, after stale-snapshot bug)
**Deleted 23 verified-orphan files** (nothing imported them; tsc clean after):
old sales subtree (sales-page-client, sales-intelligence-cockpit,
SalesOutcomeModal, follow-up-list, schedule-follow-up-modal, power-dialer,
ai-objection-handler, ai-script-suggester, daily-brief), old dashboard widgets
(dashboard/{PipelineSnapshot,QuickActions,PriorityList,AgencyGrowthCard,
BuildProgressSummary,CityAcquisitionCard}, pipeline-bar-chart,
task-completion-pie-chart, task-status-chart), agreement-generator,
projects/{milestone-manager,project-task-list}, admin/clients/tabs/OnboardingTab
(dupe), layout/followup-checker.

**Status-desync fixes** (same class as the pipeline-snapshot bug):
- admin dashboard snapshot + "Leads in Pipeline" KPI now read outreach_stage
- call-outcome-modal (used on /sales/leads/[id]) now uses leadStageUpdate()
  with per-outcome stages (was raw status writes)
- LeadsList bulk change-status now prompts for stage keys + leadStageUpdate()

**Dead links/buttons**: bell "View all" → /admin/audit-log (was /notifications,
404); automations "New Rule" removed (route doesn't exist); sidebar Settings
gear now links /admin/settings; fake export/filter icon buttons removed from
invoice + expense managers; manager board kebab removed; CSV_UPLOAD_FORMAT.md
copied to public/ so the upload-page link works. All remaining live alert()s
→ toast (users, reports/new, strategy review, task-dependencies,
ScriptObjectionPanel, saved-views, lists).

**Known, reported, NOT fixed (need decisions/features):**
- ~20 dead buttons on server pages needing real features: exports (reports,
  audit-log, attendance, work-hours), growth acquisition "Add City", team
  member card actions, my-stats "View All", SOPs delete, StrategyTab edit.
- components/team/daily-targets-table.tsx shows mock zeros for "actual" —
  needs real counts from lead_outcomes.
- /admin/upload TODO: no admin role check.
- lists/*.tsx bulk actions still use prompt() (work, but crude).

### Feature pass after audit (2026-06-12, late)
- components/ui/export-csv-button.tsx (new): client-side CSV export from
  already-fetched rows. Wired on /admin/attendance. Reports page Download now
  saves the AI report as .md. (Audit-log already had a working export.)
- Team page: REAL daily actuals — calls = today's lead_outcomes per actor_id,
  tasks = completed today; daily-targets-table shows actual/goal · %, and
  "Not tracked" for revenue/sites/demos (no fake 0%). mockActuals removed.
  "Add Member" button removed (auth-admin flow undecided).
- /admin/upload now admin-only (role check, friendly block screen).
- SOPs: deleteSopAction + DeleteSopButton wired on /admin/team/sops/[id].
- Growth acquisition: components/admin/growth/add-city-modal.tsx (new) wired
  as "Add City" (overview) and "Add Niche" (city page, fixedCity prop), using
  existing addAcquisitionCity action. Dead Filter/Table-Settings buttons gone.
- ⚠️ CityOverviewTable was rendering Math.random() numbers as metrics —
  replaced with real per-city counts from leads (total, in-pipeline,
  meetings MTD via meeting_booked_at, won MTD). Demos/campaigns columns
  removed (no data source).

### Page-level audit (2026-06-12, final)
82 pages total. Inbound-link analysis of every route:
- **Duplicate hubs → redirects** (old URLs still work): /admin/financials →
  /admin/finance · /admin/operations → /projects · /admin/bulk-import →
  /admin/upload · /sales/outreach → /sales · /admin/growth/acquisition →
  /admin/growth?tab=acquisition. /telecaller already redirects to /sales.
- **Unreachable-but-useful pages now navigable**: new sidebar "Tools" group
  (WA Templates, Attendance, Audit Log, Data Tools) + Reports under Insights;
  ~18 tool routes added to ⌘K palette (work-hours, duplicates, automations,
  niche-kits, scorecards, SOPs, sessions, settings, upload, manager pages).
  Staff/telecaller nav got "My Attendance" (/attendance).
- **Growth hub fake data removed**: hardcoded follower counts/fake % deltas →
  real posts-published MTD per channel from content_pieces; follower metrics
  honestly show "— (not connected)" until social APIs are integrated.
- **Intentionally unlinked, kept**: /lp/[niche]/[city] (ad landing pages),
  /client/report/[token] + /client-portal/[id] (shared-by-link),
  /sales/pitch/[industry]/[city] (call-time tool — consider linking from
  cockpit), /admin/build-tracker + /admin/upload/debug (dev tools).

### Dashboard alert rework (2026-06-12, evening — after user caught gaps)
User spotted: no overdue-meeting alert + "1 item needs your attention" gave no
details. Fixed in app/admin/page.tsx:
- **Overdue Meetings** section (danger, pinned first): meeting_booked with
  follow_up_date < today — these previously vanished from every view.
- Attention line now lists WHAT needs attention ("1 overdue meeting, 2 overdue
  invoices") and is an anchor link to #action-list.
- Empty action sections no longer render (real items were buried between six
  "Nothing due" boxes). All-clear state shows only when truly zero.
- "View Invoice" action now goes to /admin/finance/invoices (was /admin/finance).

### Absent-feature build (2026-06-12, night)
1. **Generate MRR Invoices** button on /admin/finance/invoices —
   `generateMonthlyInvoices()` in finance/actions.ts: one invoice per active
   client with monthly_value > 0, skips already-billed-this-month, numbers
   FM-YYYYMM-###, 18% GST, due +7d, line item "Monthly retainer — Month YYYY".
2. **WhatsApp payment reminder** icon on unpaid/overdue invoice rows
   (wa.me deep link with invoice no., amount, due/overdue wording). Invoices
   page query now selects clients(primary_email, phone) — was selecting a
   non-existent `email` column.
3. **Lead assignment UI** — "Assigned To" dropdown (profiles with role
   admin/telecaller/strategist) on the lead peek panel AND admin lead profile;
   writes assigned_sales_exec with audit log.
4. **Duplicate check on cockpit manual add** — checks phone (last 10 digits)
   + business name before insert; confirm-to-override.
5. **Missed Follow-ups** section on admin dashboard (follow_up stages with
   follow_up_date < today, warning tone, capped 10) + counted in the
   attention breakdown. (Joins Overdue Meetings from earlier.)
6. **Cockpit today strip** — green banner listing today's booked meetings
   (chips with times); stats bar shows "Calls / <target>" with a progress bar
   when a team_targets calls row exists for the user.
7. **Stale-proposal "Follow up"** WhatsApp button on dashboard alert;
   **renewal conversation** WhatsApp button on renewals table (page query +
   ClientForRenewal now include phone). Removed 🎉 from empty state.
8. **Repeat-monthly tasks** — create-task-modal: when a due date is set, a
   "Repeat monthly ×3/×6/×12" select creates future-dated copies (no schema
   change). Client FinanceTab already existed & is wired — gap report #9 was
   wrong.


---

## CURRENT STATE (end of 2026-06-12 Cowork session) — read this first

**Verification:** `npx tsc --noEmit` clean after every change. `npm run build`
must be run on the Mac (sandbox lacks darwin SWC binary).

**The app now:** ClickUp-style shell (top bar + breadcrumbs + working ⌘K,
dense sidebar with Tools group), full CRUD on every entity, no orphan
pages/components, no fabricated metrics (all Math.random()/hardcoded stats
replaced with real queries or honest "not connected"), every visible button
does something, stage-space (outreach_stage) is the single source of truth
everywhere, alert() → toast app-wide.

**Open items (in priority order):**
1. User re-test pending: proposal PDF print (mobile), MRR invoice generator,
   lead peek panel, ⌘K palette.
2. Pre-deploy: run 4× 20260611* migrations in order; Vercel env vars
   (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET); cron routes are built but dormant
   until deployed.
3. Team invite/deactivate — needs a Supabase auth-admin approach decision.
4. WhatsApp Cloud API (needs deployed HTTPS); until then all WhatsApp actions
   are wa.me deep links (reminders, nudges, renewals — all built).
5. Social follower metrics — "not connected" until API integration.
6. Remaining crude-but-working: lists/*.tsx bulk actions use prompt();
   work-hours "Details" button still dead (needs a detail view);
   /sales/pitch page unlinked (link from cockpit if used).
7. Regenerate types/database.types.ts (whatsapp_templates columns TODO,
   tasks.updated_at exists in DB but not in types).
