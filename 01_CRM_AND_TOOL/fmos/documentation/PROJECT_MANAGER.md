# Project Manager Dashboard Documentation

## Overview
**URL:** `/projects`  
**Primary User:** Project Managers / Delivery Heads  
**Purpose:** High-level oversight of ongoing work, client resource management, and team capacity planning.

---

## 1. View Modes
The dashboard offers two distinct ways to visualize work.

### A. Clients View (Default)
**Focus**: Relationship Management.
- **Organization**: Active projects are grouped by **Client**.
- **Interaction**:
  - **Expand**: Click a Client card to accordion-open details.
  - **Sub-Content**: 
    1. **Client Resources**: Links (Drive, Assets) specific to this client.
    2. **Active Projects**: Lists services (e.g., "SEO", "Web Dev") running for this client.
- **Indicators**:
  - **Red Alert Icon**: If any task within that client's projects is overdue.
  - **Progress Bar**: Aggregate completion calculated across all projects.

### B. All Projects View
**Focus**: Deadline Management.
- **Organization**: Flat grid of every single active project.
- **Use Case**: Quick scanning for "What is overdue today?" regardless of client.

---

## 2. Key Workflows

### A. Creating a Project (Manual)
*Note: Usually projects are auto-created by the Strategist Closing a deal. This is for manual overrides.*

1. **Trigger**: Click **"+ New Project"** (Top Right).
2. **Modal Flow**:
   - **Client**: Select existing or "Create New".
   - **Services**: Multi-select (e.g., Web Dev + SEO).
   - **Details**: Start Date, Deadline.
3. **System Actions**:
   - Creates `projects` row(s).
   - **Auto-Generate Tasks**: Triggers `generateProjectTasks()` which pulls from `task_templates` table to populate the initial Todo list.

### B. Managing Client Resources
A specific feature to organize external links (Google Drive, Dropbox, etc.).

1. **Navigate**: Open "Clients View" -> Expand Client.
2. **Action**: Click **"+ Add Link"** in the Resources section.
3. **Input**: Title (e.g., "Logo Assets") and URL.
4. **Result**: A clickable, external link chip appears in the client folder.
5. **Delete**: Hover over a chip and click the Trash icon to remove.

### C. Monitoring Team Workload
Located at the top ("Team Workload" accordion).

- **Logic**: Aggregates all `tasks` where `status != completed`.
- **Display**: Grouped by `assigned_to` User.
- **Sorting**: People with the most active tasks appear first.
- **Next Deadline**: Shows the *earliest* due date for that person to highlight bottlenecks.

### D. Deep Diving (Project Details)
Clicking any Project Card navigates to `/projects/[id]`.
- **Tabs**: 
  - **Overview**: Stats & Timeline.
  - **Tasks**: Full Kanban/List board for this specific project.
  - **Strategy**: AI Engine integration for client-specific growth plans and task generation.
  - **Deliverables**: Artifact and file management.
  - **Changes**: Formal change request log.

---

## 3. Filtering & Search
- **Status Filters** (Top Bar): "Needs Attention" is the most important—filters for projects with **Overdue Tasks**.
- **Search**: Real-time filtering by **Client Name** or **Email**.
