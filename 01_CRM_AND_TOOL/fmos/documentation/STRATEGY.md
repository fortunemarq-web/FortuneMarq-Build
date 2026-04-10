# Strategist Dashboard Documentation

## Overview
**URL:** `/strategist`  
**Primary User:** Senior Sales / Account Strategists  
**Purpose:** Closing deals, managing the sales pipeline from qualification to contract signature.

---

## 1. Pipeline Stages (Visual Board)
The dashboard organizes leads into columns based on `status`.

1. **Qualified**: 
   - **Source**: Leads pushed from Sales Team ("Interested") or high-score Inbound.
   - **Action**: Review details, prepare for meeting.
2. **Session Booked**:
   - **Source**: "Book Strategy" action from Sales or Strategist.
   - **Action**: Hold the meeting.
3. **Closing (Strategy Done)**:
   - **Meaning**: Meeting held, client is considering.
   - **Action**: Send Proposal.
4. **Proposal Req / Sent**:
   - **Meaning**: Negotiation phase.
5. **Contract Signed**:
   - **Meaning**: Won, waiting for final processing.
6. **Won (Closed)**:
   - **Action**: Project Creation (Handover to PM).

---

## 2. Key Workflows

### A. Closing a Deal (The Handover)
This is the most critical action on this page. It triggers the transition from "Sales" to "Production".

1. **Trigger**: Click **"Close Deal"** button on a card in "Session Booked" or "Contract Signed" columns.
2. **Modal Input**:
   - **Service Types**: Multi-select (e.g., "Web Dev", "SEO"). *Note: Creating one deal can spawn multiple projects.*
   - **Build Type**: If "Web Dev" is selected, must choose (WordPress, Custom, etc.).
   - **Deal Value**: Total contract value (₹).
   - **Contract Link**: URL to the signed PDF.
   - **Dates**: Start Date and Deadline.
3. **System Actions (Automatic)**:
   - **Client Creation**: Creates a new row in `clients` table using Company Name.
   - **Deal Logging**: Records the revenue in `deals` table.
   - **Project Provisioning**: Loops through **Selected Services** and creates **one Project per service**.
     - Example: If "Web Dev" and "SEO" are selected, 2 separate projects are created.
   - **Task Generation**: Immediately generates default tasks for each project based on the Service Type template.

### B. Booking a Session
1. **Trigger**: Click **"Book"** on a "Qualified" lead.
2. **Action**: Sets `next_action_date` and changes status to `strategy_booked`.
3. **Result**: Lead moves to "Sessions" column.

### C. Marking "Not Fit" (Lost)
1. **Trigger**: Click the **X** icon on any card.
2. **Action**: Marks status as `closed_lost`.
3. **Result**: Lead disappears from active board (viewable in "Lost Leads" toggle at bottom).

---

## 3. Dashboard View vs. Pipeline View
Toggle via tabs at the top.

### Dashboard View
Focuses on **Actions Needed Today**.
- **Metrics**: 
  - **Needs Proposal**: Leads who had a meeting but no proposal sent yet.
  - **Needs Contract**: Proposals sent > 3 days ago.
- **Lists**: Scrollable lists of specific leads requiring these actions.
- **Closed Deals**: Expandable history of all wins.

### Pipeline View
Traditional Kanban board for drag-and-drop style management (visual tracking).

---

## 4. Data Logic
- **Loss Reasons**: The dashboard analyzes notes from Lost deals to show a breakdown (e.g., "Price: 5", "Ghosted: 3").
- **Follow-up detection**: Cards highlight in **Amber** if `next_action_date` is Today.
