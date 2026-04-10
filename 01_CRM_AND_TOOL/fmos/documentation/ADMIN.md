# Admin Dashboard Documentation

## Overview
**URL:** `/admin`  
**Primary User:** Agency Owners / COOs  
**Purpose:** Total operational awareness. The "God Mode" view of the agency.

---

## 1. System Architecture
The dashboard aggregates data across 6 key pillars:
1. **Sales Engine** (Inbound/Outbound)
2. **Strategy Pipeline** (Deals/Revenue)
3. **Delivery Ops** (Projects/Tasks)
4. **Client Health** (Approvals/Retention)
5. **Agency Marketing** (SEO/Paid Ads/Content)
6. **Global Search** (Universal Cmd+K access)

---

## 2. KPI Logic & Calculations
These numbers represent the "Pulse" of the agency.

### Sales Metrics
- **New Inbound**: Count of leads created Today with `source = inbound`.
- **Calls Logged**: Count of `lead_outcomes` created Today where `type = call`.
- **Follow-ups Due**: Leads where `next_action_date == Today`.

### Strategy Metrics
- **Pipeline Value**: Sum of `deal_value` for all open Deals.
- **Win Rate (30d)**: Percentage of closed deals that were Won in the last 30 days.

### Delivery Metrics
- **Active Projects**: Count of projects where `status == in_progress`.
- **Stalled Projects**: Projects with **0 activity events** in the last 7 days. *Critical Warning*.
- **Tasks Overdue**: Total count of incomplet tasks where `due_date < Today`.

### Client Health
- **Pending Approvals**: Milestones waiting for client click.
- **Change Requests**: Scope changes waiting for PM review.

---

## 3. Workflow: Daily Briefing
1. **Navigate**: Click **"Daily Briefing"** (Big button top right).
2. **Review**: See the generated report of yesterday's performance vs today's goals.
3. **Action**: Use "Quick Links" to jump to problem areas (e.g., "Resolve Alerts").

---

## 4. Alert System
- **High Severity (Red)**:
  - System Errors (API failures).
  - Stalled Projects (>7 days no movement).
  - Monthly Goal Misses.
- **Medium/Low (Yellow/Blue)**:
  - New Staff joined.
  - Routine system backups.
- **Interaction**: Click "Resolve" to dismiss an alert (marks as `closed` in DB).

---

## 5. Quick Actions Map
Direct links to specialized admin tools:
- **Upload Leads**: Enhanced CSV importer with custom city/industry creation and duplicate prevention.
- **Strategy Engine**: Universal AI task extractor for unstructured business strategy markdown.
- **Marketing Hub**: Full-spectrum tracking for internal agency growth.
- **WhatsApp Templates**: Logic-based message manager for client communication.
- **Manage Users**: Role assignment and profile management.
- **Audit Logs**: Transparent history of all mission-critical data changes.
