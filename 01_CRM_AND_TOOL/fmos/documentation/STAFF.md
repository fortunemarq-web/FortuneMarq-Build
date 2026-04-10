# Staff Dashboard Documentation

## Overview
**URL:** `/staff`  
**Primary User:** Designers, Developers, Specialists  
**Purpose:** Focused execution. Removing noise to show "What do I need to do today?"

---

## 1. The Interface

### A. Personal Metrics (Top Row)
Immediate feedback loop for the employee.
- **My Load**: Total active tasks assigned to me.
- **Due Today**: Count of tasks with `due_date == Today`. **(Highlighted Amber)**
- **High Priority**: Count of tasks flagged `High`. **(Highlighted Red)**
- **Today's Rate**: Completion % for tasks due today. Gamification to encourage finishing daily goals.

### B. Task Cards
The core unit of work.
- **Visuals**:
  - **Border Color**: Red (Overdue), Amber (Due Today), Indigo (Normal).
  - **Context**: Shows **Client Name** and **Task Title** clearly.
- **Interactions**:
  - **Click**: Opens the **Task Execution Modal**.

### C. Filters
- **Status Tabs**: Pending / To Do / In Progress / In Review.
- **Service Dropdown**: Filter by skill ("Web Design" vs "SEO") if the staff member wears multiple hats.
- **Priority**: Filter by High/Med/Low.

---

## 2. Key Workflow: executing a Task

1. **Selection**: Click a card from the "To Do" or "Due Today" list.
2. **Modal Opens**:
   - **Instructions**: Full description.
   - **SOP**: Standard Operating Procedure content (if linked).
3. **Status Update**:
   - Move from `Not Started` -> `In Progress` when starting.
   - Move to `In Review` or `Completed` when done.
4. **Notes**: Add "Submission Notes" (e.g., "Files uploaded to Drive, link here...") before marking complete.

---

## 3. Logic & Rules
- **Visibility**: 
  - *Current Dev Mode*: Shows ALL tasks (for testing).
  - *Production*: Will filter by `assigned_to == current_user.id`.
- **Sorting**:
  - **Overdue** tasks always appear first.
  - **High Priority** tasks appear second.
  - **Due Today** tasks appear third.

### 4. Strategy Tasks (No Project)
Staff may see tasks without a linked project (e.g., "Prep for Instagram Strategy"). These are identified by a **Section Tag** label (e.g., "Instagram", "GMB") instead of a Client/Project name.
