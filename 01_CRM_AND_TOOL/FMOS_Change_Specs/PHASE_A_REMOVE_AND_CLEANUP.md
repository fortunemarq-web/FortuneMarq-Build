> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Old build-spec methodology (specs handed to the "Antigravity" tool). FMOS no longer uses spec files ("build directly" — see fmos/CLAUDE.md). Kept for history only; **proposed for deletion**. Live state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md`.

# FMOS Phase A — Remove, Simplify & Bug Fixes
**Execute this first — before any new features are added.**
**Reference:** `FORTUNEMARQ_APP_CONTEXT.md` for full app context.

---

## Goal

Strip out everything that doesn't serve the current team (Jabeer + Afifa + Zaid + Sufiyan). Fix all known bugs. Clean up the navigation so each role sees only what they need.

---

## A1 — Remove / Hide from Navigation

### Manager Leaderboards
- **Route:** `/manager/performance`
- **Action:** Remove this link from all navigation menus and sidebars.
- **Do NOT delete the page** — just hide it from nav. It can be re-enabled later when there's a manager role.
- **Check:** Anywhere in the sidebar or header that renders a link to `/manager/performance` — remove it.

### Strategist Separate Page
- **Route:** `/strategist`
- **Action:** Remove this from navigation. The strategy features are already available inside `/admin/strategy`. The separate `/strategist` role-based page is redundant.
- **Do NOT delete the page** — hide from nav only.

### Build Tracker
- **Route:** `/admin/build-tracker`
- **Action:** Remove from main navigation. This was a development tool. Not needed in the live app.
- **Do NOT delete** — just remove from nav.

---

## A2 — Navigation Cleanup Per Role

### Admin Navigation (Jabeer)
Keep only these nav items in this order:
1. Dashboard (→ `/admin`)
2. Leads (→ `/sales` — the Sales Intelligence Cockpit)
3. Clients (→ `/admin/clients`)
4. Tasks (→ `/tasks`)
5. Projects (→ `/projects`)
6. Finance (→ `/admin/finance`)
7. Growth (→ `/admin/growth`)
8. Team (→ `/admin/team`)
9. Strategy (→ `/admin/strategy`)
10. Settings / Profile (bottom of sidebar)

**Remove from Admin nav:**
- Build Tracker
- Manager Performance
- Strategist
- Marketing (this is now under Growth)
- Reports (merge into Admin dashboard or keep as sub-page under admin — do not show as top-level nav item)

### Telecaller Navigation (Afifa)
This gets rebuilt in Phase B. For now: strip her nav down to only:
1. My Calls (→ `/sales`)
2. My Stats (→ `/telecaller/my-stats`)

### Staff Navigation (Zaid, Sufiyan)
This gets rebuilt in Phase B. For now: strip to:
1. My Tasks (→ `/tasks` filtered to assigned_to = current user)

---

## A3 — Bug Fixes

### Bug 1: All Profiles Showing "New User"
**Problem:** Profiles table has no first_name/last_name set. All users display as "New User" throughout the app.
**Fix:**
```sql
-- Run in Supabase SQL Editor
-- Update the test accounts with real display names
UPDATE profiles SET full_name = 'Jabeer' WHERE role = 'admin';
UPDATE profiles SET full_name = 'Afifa' WHERE role = 'telecaller';
UPDATE profiles SET full_name = 'Zaid' WHERE role = 'staff' AND email LIKE '%zaid%';
UPDATE profiles SET full_name = 'Sufiyan' WHERE role = 'staff' AND email LIKE '%sufiyan%';
```
**If the profiles table doesn't have a `full_name` column:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
```
Then update the app to display `profile.full_name` wherever it currently shows "New User".

### Bug 2: project_status Enum Issue on Tasks Page
**Problem:** A `project_status` enum has a value "active" that causes a fetch error when querying tasks with project joins.
**Fix:** Investigate the tasks page fetch query. Find where `project_status` is being filtered or compared. Either:
- Add "active" to the enum if it's missing: `ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'active';`
- Or update the query to handle the value correctly.
**Test:** After fix, the `/tasks` page should load without errors.

### Bug 3: "2 Issues" Indicator in Bottom Left
**Problem:** A persistent "2 Issues" badge appears in the bottom-left of the app UI.
**Fix:** Find the component rendering this indicator. Investigate what the 2 issues are — likely left over from development/testing. Either fix the underlying issues or remove the indicator if it's a dev-only tool.

### Bug 4: Client Portal Test Account
**Problem:** `contact@austindental.com` is a placeholder. Austin Dental Spa is a real personal client of Jabeer's not yet properly set up.
**Action for now:** Leave this account as-is. Real data will be entered after deployment. No code change needed.

---

## A4 — Remove Manager Leaderboard Components

The Leaderboard features inside the Sales Cockpit (`/sales`) include:
- Manager Leaderboard panel showing comparative telecaller rankings
- "Manager View" toggle inside the cockpit

**Action:** Hide these components behind an `isAdmin && showLeaderboard` flag. For now, `showLeaderboard = false`. This means the components are NOT rendered for any user until this flag is changed.

Do NOT delete the components — just gate them.

---

## A5 — Clean Up the /admin Command Hub

The current Admin Command Hub (`/admin`) has a Build Progress tracker widget (showing 18/36 modules complete). This was a development tracking tool.

**Action:** Remove the Build Progress widget from the Admin dashboard. Replace the space with the new morning view content (to be built in Phase B).

---

## Checklist for Antigravity

Before marking Phase A complete:
- [ ] `/manager/performance` removed from all nav menus
- [ ] `/strategist` removed from all nav menus
- [ ] `/admin/build-tracker` removed from all nav menus
- [ ] Admin sidebar shows the 10 items listed above in correct order
- [ ] Telecaller sidebar stripped to 2 items
- [ ] Staff sidebar stripped to 1 item (My Tasks)
- [ ] "New User" bug fixed — real names show for all users
- [ ] Tasks page loads without project_status error
- [ ] "2 Issues" indicator investigated and resolved or removed
- [ ] Manager Leaderboard gated behind `showLeaderboard = false` flag
- [ ] Build Progress widget removed from Admin dashboard
