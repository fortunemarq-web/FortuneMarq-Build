# FortuneMarq - Complete Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Application Features](#application-features)
5. [Team Management & SOPs (Phase 6)](#team-management--sops-phase-6)
6. [Database Schema](#database-schema)
7. [Routes & Pages](#routes--pages)
8. [Components Library](#components-library)
9. [Key Utilities & Libraries](#key-utilities--libraries)
10. [Design System](#design-system)
11. [Authentication & Authorization](#authentication--authorization)
12. [Recent Updates & Enhancements](#recent-updates--enhancements)
13. [Phase 4 Extension: Project-Level Strategy](#phase-4-extension-project-level-strategy)

---

## Recent Updates & Enhancements

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
- Strategy pipeline management
- Deal closing capabilities with value tracking

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
- `leads`: Master prospect data.
- `profiles`: User roles and information.
- `projects`: Live project tracking.
- `tasks`: Individual project items (Includes `section_tag` and `pending` status).
- `sops`: Standard Operating Procedures library by category.
- `team_targets`: Daily/Weekly KPI goals for team members.
- `deals`: Strategy session outcomes.
- `clients`: Legal business entity records.
- `audit_logs`: Detailed system change history.

---

## Routes & Pages

### Admin
- `/admin/team`: **Team Management Dashboard** (Phase 6)
- `/admin/team/sops`: **Agency SOP Library** (New)
- `/admin/team/scorecards`: **Performance Scorecards** (New)
- `/admin/marketing`: **The Marketing Command Center**
- `/admin`: Command Hub
- `/admin/sales`: Sales Analytics
- `/admin/financials`: Revenue Tracking
- `/admin/upload`: Lead Import
- `/admin/whatsapp-templates`: **WhatsApp Template Manager**
- `/admin/reports`: **AI Weekly Agency Report**
- `/manager/performance`: **Manager Performance Dashboard**
- `/manager/pipeline`: **Niche Sales Pipeline**
- `/client/dashboard`: **Enhanced Client Portal**
- `/client/report/[token]`: **Public Performance Report**
- `/telecaller/my-stats`: **Personal Performance Hub**

---

## Components Library

### 1. Lead & Sales Components
- `LeadCaptureForm`: Multi-step high-conversion form for inbound leads.
- `SalesCockpitGrid`: Split-screen intelligence grid for high-velocity dialing.
- `SmartPitchEngine`: AI-powered script generator based on client data.

### 2. Project & Task Management
- `TaskBoard`: Multi-status Kanban board with drag-and-drop.
- `TaskCard`: Interactive cards with SOP links and priority flags.
- `ProjectTimeline`: Visual roadmap of client deliverables.

### 3. Team & Operations
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

**Document Version**: 3.9  
**Last Updated**: March 15, 2026 (Ref: Documentation Audit & Phase 6 Launch)
  
**Application Version**: Next.js 16.1.6  
**Status**: Production Ready - Marketing Module Beta

### Version History
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
