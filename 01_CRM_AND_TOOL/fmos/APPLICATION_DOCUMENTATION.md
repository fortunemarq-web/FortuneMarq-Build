# FortuneMarq OS (FMOS) — Complete Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Application Features](#application-features)
5. [Outreach Sales System (FMOS Phase)](#outreach-sales-system)
6. [Client Package & Health Management](#client-package--health-management)
7. [Team Management & SOPs (Phase 6)](#team-management--sops-phase-6)
8. [Database Schema](#database-schema)
9. [Routes & Pages](#routes--pages)
10. [Components Library](#components-library)
11. [Key Utilities & Libraries](#key-utilities--libraries)
12. [Design System](#design-system)
13. [Authentication & Authorization](#authentication--authorization)
14. [Recent Updates & Enhancements](#recent-updates--enhancements)
15. [Phase 4 Extension: Project-Level Strategy](#phase-4-extension-project-level-strategy)

---

## Recent Updates & Enhancements

### April 2, 2026 — Phase E: Finance & Forecasting
- **Finance Split & P&L Module**: Implemented `revenue_type` on invoices. The Finance Dashboard and P&L view now isolate MRR from Setup Fees and One-Time project revenues for precise recurring revenue analytics.
- **Revenue Forecast Widget**: Embedded into the Admin Dashboard. Actively tracks current MRR vs a ₹50,000 baseline and calculates a 30% conservative pipeline forecast from Sent proposals.
- **Automated Invoice Reminders**: Contextual alerts bound to the 1st-5th of the month instructing the Admin to generate recurring invoices.
- **Retainer Package Consolidation**: Streamlined schema to host `package_tier` and `services_active` natively on the `clients` table, radically improving performance by eliminating expensive joins on the Client listing table.
- **Upsell Management Integration**: Deployed a direct "Flag for Upsell Conversation" toggle inside the Client profile overview, triggering an immediate Zap icon indicator across the global client tables.


### March 25, 2026 — Strategist Dashboard & Fulfillment Engine
- **Strategist Dashboard Overhaul**: Launched action-oriented dashboard focusing on "Closing" and "Proposals".
- **Fulfillment Engine (Deal Closing)**: Automated the handover from Sales to Production. Closing a deal now creates 4 entities: Client record, Deal log, Service-specific Projects (one per service), and automated Task/Milestone generation from templates.
- **Pipeline Synchronization**: Unified the 5-stage strategist pipeline (`qualified` → `strategy_booked` → `strategy_completed` → `proposal_sent` → `contract_signed`) with automated status updates.
- **Action-Targeted Metrics**: Introduced "Needs Proposal" (Completed Strategy session but no proposal) and "Needs Contract" (Proposal sent >3 days ago) tracking to prevent deal leakage.
- **Loss Analysis**: Implemented high-fidelity loss reasoning based on lead notes (Price, Ghosted, Not a Fit) to improve sales training.
- **Micro-Animations**: Added "Today's Follow-up" amber highlights for high-priority sessions and calls.

### March 25, 2026 — Codebase Audit & Stabilization
- **Full Codebase Audit**: Comprehensive analysis — TypeScript compilation (0 errors), production build (clean), all routes validated.
- **Next.js 16 `searchParams` Fix**: Corrected `searchParams` prop typing on `/admin/team/scorecards` and `/admin/team/sops` pages to use `Promise<...>` type per Next.js 16 async params convention. Eliminated redundant `await` calls.
- **Import Hygiene**: Moved misplaced `clsx` import from bottom of `sops/page.tsx` to proper top-of-file location.
- **Documentation Overhaul**: Updated APPLICATION_DOCUMENTATION.md to v4.1 with complete coverage of Outreach Sales System, Client Package Management, 8 new database tables, and all new routes/components.

### March 24, 2026 — TypeScript Build Stabilization
- **Production Build Fix**: Resolved all TypeScript type mismatches by applying consistent `(supabase as any)` casting across marketing, sales outreach, and project management modules.
- **Build Pipeline**: Achieved clean `npx tsc --noEmit` and `npm run build` with zero errors across all 70+ routes.

### March 20–22, 2026 — Outreach Sales System & Client Packages (FMOS Phase)
- **Outreach Board (`/sales/outreach`)**: Full Kanban-style board tracking leads through a 7-stage sales outreach pipeline (Touch 1 → PDF → Follow-up → Meeting → Proposal → Won/Lost).
- **Advance Stage Modal**: Contextual modal that adapts fields per outreach stage — PDF name, follow-up scheduling, meeting booking, proposal type selection, and outcome logging.
- **Server Actions**: `advanceOutreachStage` server action handles all stage transitions, inserts related records (pdf_deliveries, meetings, proposals), updates lead status, and logs activity events.
- **Client Packages**: Full package management system with service selection, monthly/one-time value tracking, renewal dates, and upsell eligibility.
- **Health Score System**: 5-dimension health scoring (Payment, Results, Engagement, Tenure, Risk) with auto-upsell flagging for healthy clients.
- **Upsell Tracking**: Complete upsell attempt logging with conversion tracking and automatic package value increment via `increment_package_value` RPC.
- **Database Migration**: 8 new tables deployed — `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`, `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`.
- **TypeScript Types**: `types/database.types.ts` extended with Row/Insert/Update types for all 8 new tables plus new lead columns.

### March 15, 2026 — Team Management & Monitoring (Phase 6)
- **Phase 6: Team Management Dashboard**: Launched central hub for tracking internal team performance, daily targets, and scorecards.
- **SOP Library System**: Introduced a categorized library for Standard Operating Procedures with tool requirements and estimated timeframes.
- **AI Usage Tracking**: Implemented `ai_usage_logs` to monitor token consumption, model performance, and feature-specific AI activity.
- **Notification System Upgrade**: Enhanced `notifications` table with `type` and `link` support for real-time, actionable alerts across the platform.

### March 12, 2026 — Strategy Engine v2 & Task Board Evolution
- **Project-Level Strategy Engine**: Integrated AI-driven strategy analysis directly within the Client details page. Allows generation of client-specific tasks based on business context.
- **Improved Task Board Management**: Added support for a "Pending" status and "Strategy Tasks" (tasks without explicit project links, identified by `section_tag`).
- **Robust Auth Integration**: Standardized all server-side Supabase calls to use `createServerClientWithCookies`, ensuring reliable session detection and RLS handling across all routes.
- **Explicit Database Joins**: Refactored Supabase queries to use explicit column selection and aliased joins (e.g., `assignee:profiles`) to prevent "permission denied for table users" errors.

### March 11, 2026 — AI Provider & Animation Refactor
- **Transition to Framer Motion**: Completely removed GSAP from the project and unified all animations using Framer Motion for better performance and smaller bundle sizes.
- **Anthropic Claude Integration**: Switched core AI operations to Anthropic models (via OpenRouter) for superior strategy generation and PRD extraction.
- **Agency Marketing Module**: A standalone suite for tracking Organic SEO, Paid Campaigns, and Content Calendars.
- **Professional SaaS Light Theme**: Fully refactored UI using a clean "SaaS Light" aesthetic (Slate-50 background, White cards, Slate-900 Sidebar) similar to Jira and ClickUp.
- **Mobile Experience Overhaul**: Unified navigation with a sticky header and smooth offcanvas sidebar for mobile devices.
- **Global Search (Cmd+K)**: Implemented high-performance, enterprise-grade global search using Postgres Full-Text Search.

### December 2024 — Sales Intelligence & Management
- **Sales Intelligence Cockpit**: Redesigned unified interface for high-velocity dialing and lead intelligence.
- **Turbo Mode**: High-velocity dialing mode with auto-advance and countdown timers.
- **Enhanced Data Management**: Smart CSV Uploader with on-the-fly industry/city creation and duplicate detection.

---

## Overview

**FortuneMarq** is a comprehensive CRM, Project Management, and Marketing Analytics platform designed specifically for digital marketing agencies. The application streamlines the entire client lifecycle—from initial lead generation and sales prospecting to project execution, marketing tracking, and client delivery.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router with Turbopack)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts v3.5.1

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (`@supabase/ssr` v0.8.0)
- **API**: Next.js Server Components & Server Actions

---

## User Roles & Permissions

### 1. **Admin** (`/admin`)
- Full access to all features
- Command Hub with executive summary
- **Agency Marketing**: Full oversight of SEO, Paid Ads, and Content Pipeline
- Financial analytics and sales force management

### 2. **Sales Exec / Telecaller** (`/sales`)
- Sales Intelligence Cockpit
- Power dialer interface with one-click calling & WhatsApp
- AI-powered pitch generation

### 3. **Strategist** (`/strategist`)
- **Action-Oriented Dashboard**: Track "Needs Proposal" and "Needs Contract" action items.
- **High-Velocity Pipeline**: Manage leads from Qualification to Contract Signature.
- **Fulfillment Automation**: One-click deal closing that auto-provisions Clients, Projects, and Task templates for Production.
- **Strategy Session Logger**: Structured outcome logging with integrated audit trails and performance metrics.

### 4. **Project Manager** (`/projects`)
- Project dashboard and task assignment
- Milestone tracking and approval workflow

### 5. **Staff / Specialist** (`/staff`)
- Personal task execution dashboard

### 6. **Client** (`/client/dashboard`)
- Self-service project portal and milestone visibility

---

## Application Features

### 1. Agency Marketing Module (New)

#### Overview Dashboard
- **Real-time KPIs**: Track Total Leads, Avg. CPL, Spend MTD, and ROI.
- **Marketing Weekly Brief**: AI-generated (or manual) executive summary of the week's performance, including key wins and recommendations.
- **Lead Source Breakdown**: Visual distribution of leads by channel (SEO, Meta, LinkedIn, etc.).

#### Organic & SEO Tracking
- **Keyword Tracker**: Monitor keyword rankings, search volumes, and ranking difficulty.
- **Quick Wins Detection**: Automatic identification of keywords ranking in positions 4-10 that are ready for optimization.
- **Traffic Insights**: Organic vs. Paid traffic trend analysis.

#### Paid Campaigns Management
- **Multi-Platform Support**: Track Meta Ads, Google Ads, LinkedIn, and YouTube.
- **Budget Pacing**: Visual progress bars showing current Spend vs. Monthly Budget.
- **Inline Editing**: Rapidly update actual spend and lead counts directly from the table.

#### Content Calendar
- **Pipeline View (Kanban)**: Manage content from "Idea" to "Published" through a drag-and-drop style interface.
- **Calendar View**: Visual monthly view for scheduled posts across all platforms.
- **Workflow Icons**: Visual coding for content types (Blog, Video, Reel, Carousel, etc.).

### 2. Multi-Niche VSL & Landing Page System (New)
- **Dynamic Routing**: Automatic landing page generation via `app/lp/[niche]/[city]/page.tsx`.
- **Premium Design**: High-converting "Glassmorphism" UI with dark mode, ambient glows, and mobile-optimized layouts.
- **VSL Integration**: Dedicated placeholder for Video Sales Letters with high-engagement CTA widgets.
- **Inbound Lead Capture**: Integrated form that tags leads as `inbound` and logs them directly into the Sales Intelligence Cockpit.
- **Exclusivity Logic**: Visual indicators for "Territory Lockout" to increase conversion urgency.

### 3. Lead Management System
- **Inbound (Hot)**: Prioritized leads from forms/referrals with flame icon (🔥).
- **Outbound (Cold)**: Proactive prospecting leads with zap icon (⚡).
- **Smart CSV Uploader**: Bulk import leads with automatic duplicate detection and dynamic industry creation.

### 3. Sales Intelligence & Power Dialer
- **Split-Screen Layout**: Intelligence cheat sheet on the left, action grid on the right.
- **Smart Pitch Engine**: Generates personalized scripts based on lead website presence and market data.
- **Turbo Mode**: Automatic queue advancement for "No Answer" or "Busy" outcomes.
- **Follow-up Engine**: Real-time sidebar tracking today's scheduled calls with overdue alerts and "Quick Complete" functionality.
- **WhatsApp Template Engine**: One-click messaging from the cockpit using pre-approved, variable-substituted templates.
- **AI Brain Integration**: 
    - **Smart Script Suggester**: Personalised openers based on lead niche/city.
    - **Live Objection Handler**: Instant AI rebuttals for prospect resistance.
    - **Daily AI Brief**: Personalised "game plan" summary for telecallers.
- **Performance & Gamification**:
    - **Telecaller Personal Stats**: Individual dashboards with "fire" streak counters and trophy badges.
    - **Manager Leaderboards**: Comparative rankings by Qualified Rate and Call Volume.
    - **Goal Tracking**: Visual daily progress bars (e.g., "100 Calls/Day" target).
- **Niche Pipeline Kanban**: 
    - **Visual 7-Stage Funnel**: Track leads from "New" to "Closed Won/Lost".
    - **Industry-Specific Views**: Filter the entire sales board by market (e.g., Dental, Gym).
    - **Drag & Drop Workflow**: Seamlessly move prospects across the pipeline stages.
    - **Stalled Lead Detection**: Highlights leads that haven't moved in a specific stage for over 7 days.
- **Client Portal Enhancement**:
    - **Deliverable Approval System**: Clients can approve or request revisions for design, content, and reports directly from their dashboard.
    - **Secure Magic Links**: Password-free access to performance reports for easy sharing with stakeholders.
    - **Automated Report Archive**: Historical access to all published monthly/weekly reports.
    - **Real-time Progress Radar**: Visual roadmap showing precisely where the project stands in the delivery cycle.
- **Global Search Engine**:
    - **Unified Search (Cmd+K)**: Instant access to all CRM data from anywhere in the app.
    - **Role-Based Scoping**: Telecallers see only their assigned leads; Admins see full audit logs and financial data.
    - **Persisted History**: Remembers your last 5 searches for high-speed multitasking.
    - **Cross-Entity Indexing**: Deep-search lead industries, task descriptions, and WhatsApp message contents.

### 4. Strategy-to-Task AI Engine (Phase 4)

#### Universal Strategy Engine (`/admin/strategy`)
- **Actionable Task Extraction**: Converts unstructured strategy documents (Paste from Claude) into structured database tasks.
- **Contextual Distribution**: Automatically assigns tasks to specific sections like "Instagram", "GMB", or "Acquisition".
- **Intelligent Batching**: LLM breaks large milestones into specific, per-person tasks with AI-suggested due dates.

#### Client-Level Strategy Tab (New)
- **Direct Client Context**: Generate strategies directly from the Client Profile page (`/projects/[id]`).
- **Strategy Log**: History of all previous strategy runs for a specific client.
- **Artifact Generation**: Automatically creates PRDs, image prompts, and meeting briefs based on client-specific data.
#### Pending Task Support
- Allows creation of tasks that aren't yet linked to a specific project (Strategy Prep).
- Integrated into the global task board with a "Pending" status column.

### 5. Fulfillment & Deal Closing Engine (New)

#### Automated Onboarding Workflow
- **Client & Deal Logic**: Automatically converts a `Won` lead into a `Client` entity and logs the financial `Deal`.
- **Project Splitting**: Spawns independent `Project` records for each selected service (e.g., separate projects for SEO and Web Dev) to ensure clean delivery folders.
- **Template Injection**: Instant injection of Tasks and Milestones into new projects using `task_templates` and `milestone_templates` categorized by niche.
- **Strategist-to-PM Handover**: Structured metadata transfer ensuring Project Managers have all strategy notes upon project creation.

---

## Outreach Sales System (FMOS Phase)

### 1. Outreach Board (`/sales/outreach`)
- Kanban board with 7 active columns + 1 closed column tracking leads from Touch 1 through Won/Lost.
- **Lead Cards**: Color-coded cards showing company, contact, industry badge, phone link, days-in-stage indicator (red >7d, amber >3d), and stage-specific action buttons.
- **Advance Stage Modal**: Smart modal adapting to current stage — confirms touch sent, logs PDF delivery, schedules follow-ups, books meetings with date/time/location, selects proposal types, and logs final outcomes.
- **Activity Events**: All stage transitions are logged to `activity_events` for full audit trail.
- **Stat Pills**: Real-time counters for Active leads, Today's Meetings, Pending Follow-ups, and Proposals Out.

## Client Package & Health Management

### 1. Package System (`/admin/clients`)
- Full CRUD for client service packages with multi-service selection, monthly/one-time value tracking, and renewal date management.
- **Health Score Dashboard**: 5-dimension scoring system (Payment, Results, Engagement, Tenure, Risk) producing a weighted composite score.
- **Upsell Engine**: Automatic upsell eligibility flagging (score ≥ 80), upsell attempt logging with conversion tracking, and automatic package value increment.
- **Client Stats**: Real-time KPIs — Total Active Clients, MRR, Avg Health Score, Upsell Eligible, At Risk, Renewals (30d).

---

## Team Management & SOPs (Phase 6)

### 1. Central Team Dashboard (`/admin/team`)
- **Member Overview**: Cards for all team members showing current workload and active targets.
- **Real-time Performance**: Live stats on calls made, tasks completed, and revenue generated per member.

### 2. SOP Library (`/admin/team/sops`)
- **Categorized Procedures**: SOPs grouped by department (Sales, Delivery, Onboarding, Finance).
- **Interactive Guides**: Detailed step-by-step instructions with tool requirements and time estimates.
- **Admin Editor**: Full CRUD capabilities for admins to maintain agency standards.

### 3. Role-Based Scorecards (`/admin/team/scorecards`)
- **Weekly Performance Metrics**: Comparison of actual performance vs. targets for different roles.
- **Historical Trends**: Track team efficiency over time with weekly filtering.

### 4. Target Management
- **Dynamic Targets**: Set daily/weekly targets for Calls, Tasks, Sites, or Revenue per user.
- **Progress Tracking**: Visual progress bars in the Telecaller stats and Admin dashboards.

---

## Database Schema

### Outreach & Sales Tables (New — FMOS Phase)
#### `outreach_sequences`
One row per lead, tracking position in 7-stage sales pipeline.
- `lead_id`, `stage` (touch1_pending → won/lost/dead), `touch1_sent_at/by`, `pdf_sent_at/by/name`, `followup_scheduled_at`, `meeting_booked_at/date/by`, `proposal_sent_at/by/type`, `outcome`, `outcome_at/notes`, `assigned_to`.
- Unique constraint on `lead_id`. Auto-initialized via `trg_init_outreach` trigger on lead insert.

#### `pdf_deliveries`
Tracks individual PDF documents sent to leads.
- `lead_id`, `sequence_id`, `pdf_name`, `pdf_type`, `sent_by`, `delivery_method`, `confirmed_read/at`.

#### `meetings`
Scheduled and completed sales meetings.
- `lead_id`, `sequence_id`, `scheduled_at`, `duration_minutes`, `location`, `conducted_by`, `booked_by`, `status` (scheduled/completed/cancelled/no_show), `outcome`, `rescheduled_to`.

#### `proposals`
Formal proposals sent after meetings.
- `lead_id`, `sequence_id`, `meeting_id`, `proposal_number` (auto-generated FM-P-YYYY-XXXX), `proposal_type` (V1–V8), `status`, `monthly_value`, `onetime_value`, `quotation_sent_at`, `agreement_sent_at`, `closed_at`.

#### `client_packages`
Active service packages per client.
- `client_id` (unique), `package_name`, `services[]`, `monthly_value`, `onetime_value`, `start_date`, `renewal_date`, `status`.
- Health scores: `health_score`, `hs_payment/results/engagement/tenure/risk`, `health_updated_at`.
- Upsell tracking: `upsell_eligible`, `upsell_target`, `upsell_last_attempt_at/outcome`.

#### `upsell_attempts`
Log of all upsell attempts on clients.
- `client_id`, `package_id`, `attempted_by`, `current_services[]`, `target_service`, `method`, `outcome`, `follow_up_date`, `converted_value`.

#### `lead_outcomes`
Historical outcomes log for leads.
- `lead_id`, `outcome`, `notes`, `follow_up_date`, `logged_by`.

#### `activity_events`
Generic activity audit trail for any entity.
- `entity_type`, `entity_id`, `event_type`, `description`, `metadata` (JSONB), `created_by`.

### AI & Logging Tables
#### `ai_usage_logs`
Tracks AI consumption and performance monitoring.
- `feature` (script_suggester, weekly_report, etc.), `model`, `tokens_used`, `created_by`.

#### `notifications` (Upgraded)
Real-time system alerts.
- `title`, `body`, `type` (task_assigned, status_change, etc.), `link`, `is_read`.

### Marketing Tables
#### `content_pieces`, `seo_keywords`, `ad_campaigns`
Consolidated tracking for organic and paid marketing efforts.
- Includes content pipeline, keyword rankings, and ad spend pacing metrics.

#### `strategy_runs` & `strategy_recommendations`
Archive of AI strategy generation and extracted actionable tasks.

### Core Tables
- `leads`: Master prospect data. Includes `outreach_stage`, `meeting_booked_at`, `proposal_sent_at`.
- `profiles`: User roles and information.
- `projects`: Live project tracking.
- `tasks`: Individual project items (Includes `section_tag` and `pending` status).
- `sops`: Standard Operating Procedures library by category.
- `team_targets`: Daily/Weekly KPI goals for team members.
- `deals`: Strategy session outcomes.
- `clients`: Legal business entity records.
- `audit_logs`: Detailed system change history.

### Database Functions & Triggers
- `init_outreach_sequence()`: Trigger function that auto-creates an outreach_sequences row on lead insert.
- `increment_package_value(p_package_id, p_amount)`: RPC to increment package monthly_value on upsell conversion.

---

## Routes & Pages

### Sales & Outreach
- `/sales`: **Sales Intelligence Cockpit** — Power Dialer, Lead Management
- `/sales/outreach`: **Outreach Board** — Kanban pipeline for 7-stage outreach sequences
- `/sales/leads/[id]`: **Lead Profile** — Detailed lead view with history
- `/sales/pitch/[industry]/[city]`: **Pitch Generator** — Industry/city-specific pitch scripts

### Admin
- `/admin`: **Command Hub** — Executive dashboard
- `/admin/clients`: **Client Management** — Health scores, MRR, packages, upsell
- `/admin/clients/renewals`: **Renewal Tracker**
- `/admin/clients/[id]`: **Client Detail** — Package management, strategy, reports
- `/admin/team`: **Team Management Dashboard** (Phase 6)
- `/admin/team/sops`: **Agency SOP Library**
- `/admin/team/sops/[id]`: **SOP Detail/Editor**
- `/admin/team/scorecards`: **Performance Scorecards**
- `/admin/marketing`: **Marketing Command Center** — Organic, Paid, Content
- `/admin/strategy`: **Strategy Engine** — AI-powered strategy extraction
- `/admin/strategy/archive`: **Strategy Archive**
- `/admin/strategy/review`: **Strategy Review**
- `/admin/finance`: **Finance Dashboard** — Invoices, Expenses, P&L
- `/admin/growth`: **Growth Channel Management** — SEO, GMB, Social, Acquisition
- `/admin/sales`: Sales Analytics
- `/admin/financials`: Revenue Tracking
- `/admin/upload`: Lead Import
- `/admin/whatsapp-templates`: **WhatsApp Template Manager**
- `/admin/reports`: **AI Weekly Agency Report**
- `/admin/audit-log`: **System Audit Log**
- `/admin/users`: **User Management**
- `/admin/data-management`: **Data Manager**
- `/admin/duplicates`: **Duplicate Lead Review**
- `/admin/niche-kits`: **Niche Kit Grid**
- `/admin/operations`: **Operations Dashboard**
- `/admin/sessions`: **Session Management**
- `/admin/work-hours`: **Work Hours Tracker**

### Other Roles
- `/manager/performance`: **Manager Performance Dashboard**
- `/manager/pipeline`: **Niche Sales Pipeline**
- `/projects`: **Project Dashboard**
- `/projects/[id]`: **Project Detail** — Tasks, Milestones, Strategy Tab
- `/projects/list`: **Project List View**
- `/tasks`: **Task Board** — Kanban with Pending/Strategy support
- `/tasks/list`: **Task List View**
- `/staff`: **Staff Dashboard**
- `/strategist`: **Strategist Dashboard**
- `/strategist/deals`: **Deals Management**
- `/client/dashboard`: **Enhanced Client Portal**
- `/client/report/[token]`: **Public Performance Report**
- `/client-portal/[id]`: **Client Portal Detail**
- `/telecaller/my-stats`: **Personal Performance Hub**
- `/attendance`: **Attendance Tracker**
- `/lp/[niche]/[city]`: **Dynamic Landing Pages**

---

## Components Library

### 1. Outreach Sales Components (New)
- `OutreachBoard`: Kanban board with 7 active columns + closed column, industry filter, stat pills.
- `OutreachLeadCard`: Individual lead cards with days-in-stage indicator, phone link, stage-specific action button, and profile link.
- `AdvanceStageModal`: Smart modal that adapts form fields based on current outreach stage.
- `outreach-actions.ts`: Server action handling all stage transitions with related record creation.

### 2. Client Management Components (New)
- `PackageModal`: Full package editor with multi-service selection (14 service types), value inputs, dates, and upsell configuration.
- `HealthScoreModal`: 5-dimension slider interface for scoring client health.
- `UpsellAttemptModal`: Form for logging upsell attempts with outcome and conversion tracking.
- `ClientsTable`: Master client table with inline package info, health badges, and action buttons.
- `AddClientModal`: Client creation form.

### 3. Lead & Sales Components
- `LeadCaptureForm`: Multi-step high-conversion form for inbound leads.
- `SalesCockpitGrid`: Split-screen intelligence grid for high-velocity dialing.
- `SmartPitchEngine`: AI-powered script generator based on client data.
- `PowerDialer`: High-velocity calling interface with auto-advance.
- `SalesOutcomeModal`: Outcome logging with voice-to-text support.
- `FollowUpList`: Real-time sidebar for today's scheduled follow-ups.
- `WhatsAppTemplateButton`: One-click WhatsApp messaging with template matching.

### 4. Project & Task Management
- `TaskBoard`: Multi-status Kanban board with drag-and-drop.
- `TaskCard`: Interactive cards with SOP links and priority flags.
- `ProjectTimeline`: Visual roadmap of client deliverables.
- `ChangeRequestBoard`: Change request management.
- `DeliverableManager`: Deliverable tracking and approval.
- `MilestoneManager`: Milestone creation and progress tracking.

### 5. Marketing Components
- `MarketingDashboard`: Tab-based interface (Overview, Organic, Paid, Content).
- `OverviewTab`: KPI dashboard with AI-generated weekly brief.
- `OrganicSeoTab`: Keyword tracker with quick wins detection.
- `PaidCampaignsTab`: Multi-platform campaign table with inline spend editing and CPL trend charts.
- `ContentCalendarTab`: Pipeline (Kanban) and Calendar views for content management.

### 6. Team & Operations
- `SOPCard`: Interactive SOP viewer with step management.
- `SOPEditor`: Rich editor for creating and updating agency procedures.
- `RoleScorecard`: Data-dense comparison of team efficiency.
- `DailyTargetsTable`: Inline editor for setting member goals.

---

## Key Utilities & Libraries

### 1. Supabase Client (`lib/supabase.ts`)
- `createClient`: Main client-side utility for database access.
- `createServerClientWithCookies`: Server-side client with robust session support.

### 2. AI Infrastructure (`lib/ai.ts`)
- **Provider**: Anthropic Claude 3.5 Sonnet (via OpenRouter).
- **Extraction**: PRD and Strategy extraction from unstructured text.

### 3. Notifications System (`lib/notifications.ts`)
- `sendNotification`: Real-time Pusher-style alerts with database persistence.
- `link` support for instant navigation from alerts.

---

## Design System

### Visual Identity (SaaS Light)
- **Primary Aesthetic**: Clean, structured, highly readable light theme.
- **Primary Background**: `bg-slate-50` (Cool gray).
- **Surface Background**: `bg-white` (High contrast panels).
- **Sidebar**: `bg-slate-900` (Dark high-contrast sidebar).
- **Brand Accent**: `#42CA80` (FortuneMarq Green).

### Typography
- **Headings**: DM Sans (Sans-serif, -1.5% tracking).
- **Body**: IBM Plex Sans (Highly legible system font).
- **Data/Numbers**: IBM Plex Mono (Precise, tabular formatting).

### Component Guidelines
- **KPI Cards**: Rounded (12px), bordered (slate-200), subtle shadow, with semantic top-borders.
- **Modals**: Backdrop blur (`bg-black/60`) and bottom-sheet transition on mobile.
- **Responsive**: Mobile-first design with 44px+ touch targets and sticky headers.

---

## Version Information

**Document Version**: 4.3  
**Last Updated**: April 2, 2026 (Ref: Phase E Finance & Forecasting)
  
**Application Version**: Next.js 16.1.6  
**TypeScript**: 5.x (0 errors)  
**Build Status**: ✅ Production Ready — Clean build, all routes validated  
**Status**: Production Ready

### Version History
- **v4.3** (April 2, 2026): **Phase E: Finance & Forecasting.** Integrated MRR revenue splitting, P&L reporting, interactive Revenue Forecast Widgets, Retainer Package consolidation into the clients schema, and monthly invoicing reminders.
- **v4.2** (Mar 25, 2026): Strategist Dashboard overhaul. Added action-priority metrics (Needs Proposal/Contract), 4-step fulfillment automation (Client/Deal/Project/Tasks), and loss reason analysis.
- **v4.1** (Mar 25, 2026): Full codebase audit. Fixed Next.js 16 `searchParams` typing on 2 pages. Comprehensive documentation update with all FMOS phase changes.
- **v4.0** (Mar 24, 2026): TypeScript build stabilization — resolved all type mismatches with `(supabase as any)` casting. Clean production build.
- **v3.10** (Mar 20–22, 2026): FMOS Phase: Outreach Board (7-stage Kanban), Client Packages, Health Scores, Upsell Engine, 8 new database tables, database triggers & RPC functions.
- **v3.9** (Mar 15, 2026): Phase 6 Launch: Team Management hub, SOP Library system, Role-based scorecards, AI usage logging, and notification links.
- **v3.8** (Mar 12, 2026): Strategy Engine v2: Project-level strategy tab, PRD generation, 'Pending' task status support, and auth/cookie reliability overhaul.
- **v3.7** (Mar 11, 2026): Framer Motion Migration: Removed GSAP, switched to Anthropic Claude via OpenRouter, and integrated Global Search indexing.
- **v3.6** (Mar 2026): Client Portal Enhancement: Upgraded client experience with artifact approvals, performance report archives, and secure magic link access.
- **v3.5** (Mar 2026): Niche Pipeline Kanban: Visual sales pipeline per industry with drag-and-drop transitions and automated status tracking.
- **v3.4** (Mar 2026): Performance Dashboards: Added Manager Leaderboards and Telecaller personal stats with streak counters and daily goal tracking.
- **v3.3** (Mar 2026): AI Brain Integration: Integrated OpenRouter for real-time script generation, objection handling, and executive weekly summaries.
- **v3.2** (Mar 2026): WhatsApp Template System, Follow-up Engine & Dynamic VSL Landing Pages.
- **v3.1** (Mar 2026): KPI Snapshot stability fix, authenticated admin client integration, and enhanced error diagnostics.
- **v3.0** (Mar 2026): Agency Marketing Module, Light Theme pass, Mobile Responsiveness Audit.
- **v2.1** (Jan 2026): Env variable management and security pass.
- **v2.0** (Dec 2024): Sales Intelligence Cockpit redesign.
- **v1.0**: Initial Release (Core CRM & PM).

---

**© 2026 FortuneMarq. All rights reserved.**
