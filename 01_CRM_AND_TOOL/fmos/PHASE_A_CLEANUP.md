# DEPRECATED — Do not use this file
**See `00_FIX_MASTER.md` and `PHASE_1_DATABASE_MIGRATIONS.md` through `PHASE_6_WHATSAPP_AND_UI.md` instead.**

---

## 1. Who You Are and What You're Working On

You are Antigravity — a senior full-stack developer working on **FMOS** (FortuneMarq Operating System), a custom CRM and ops tool built for FortuneMarq Media & Marketing, a local digital marketing agency in Hubli, Karnataka.

**The app is already built and running on localhost:3000.** You are NOT building from scratch. You are cleaning up, fixing bugs, and preparing the codebase for new features.

**Stack:**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (auth + database)
- @supabase/ssr v0.8.0 — cookie-based sessions
- Design: SaaS Light theme — bg-slate-50 backgrounds, bg-white cards, bg-slate-900 sidebar, `#42CA80` green accent

**App location:** `01_CRM_AND_TOOL/fmos/`

**Read these files first before touching any code:**
- `01_CRM_AND_TOOL/fmos/CLAUDE.md` — full app context, all routes, all DB tables
- `01_CRM_AND_TOOL/fmos/UI_UX_GUIDELINES.md` — design rules to follow

---

## 2. The Team Using This App

| Person | Role in App | What They Need |
|---|---|---|
| Jabeer | `admin` | Full access — command view every morning |
| Afifa | `telecaller` | Simplified: call queue, scripts, outcomes only |
| Zaid | `staff` | Tasks only: what's assigned to them |
| Sufiyan | `staff` | Same as Zaid |

User roles are stored in the `profiles` table as the `role` column.

---

## 3. What Is Already Done (DO NOT REDO)

The following Phase A items have already been completed. **Do not touch these files:**

✅ `components/ui/app-sidebar.tsx` — Nav config per role already cleaned up. Admin, telecaller, and staff navs are correct.

✅ `app/admin/sales/page.tsx` — `showLeaderboard = false` already set. Leaderboard is gated.

✅ `types/database.types.ts` — `meeting_booked` and `follow_up_due` added to `lead_status` enum.

✅ `components/sales/telecaller-cockpit.tsx` — Null type error on niches/cities filter arrays fixed.

✅ `app/admin/leads/[id]/page.tsx` — `whatsapp_templates` table cast to `any`.

✅ `app/admin/leads/[id]/lead-profile-admin-client.tsx` — `client_onboarding_tasks` cast to `any`.

✅ `app/admin/clients/page.tsx` — Removed `packages` prop from `ClientsTable`.

**TypeScript currently shows 0 errors. Do not introduce new TypeScript errors.**

---

## 4. Remaining Tasks for Phase A

### A1 — Run SQL Migration in Supabase (New User Bug Fix)

**Problem:** All users display as "New User" throughout the app because the `profiles` table has no `full_name` set.

**Fix — run this in Supabase SQL Editor:**

```sql
-- Step 1: Add the column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Set names for each user based on role
-- (Update these WHERE clauses to match the actual email addresses in your Supabase auth.users table)
UPDATE profiles SET full_name = 'Jabeer' WHERE role = 'admin';
UPDATE profiles SET full_name = 'Afifa' WHERE role = 'telecaller';
UPDATE profiles SET full_name = 'Zaid' WHERE role = 'staff' AND id IN (
  SELECT id FROM profiles WHERE email ILIKE '%zaid%'
);
UPDATE profiles SET full_name = 'Sufiyan' WHERE role = 'staff' AND id IN (
  SELECT id FROM profiles WHERE email ILIKE '%sufiyan%'
);

-- Step 3: Verify
SELECT id, email, role, full_name FROM profiles;
```

**If the profiles table does not have an `email` column,** use the Supabase auth.users join:
```sql
UPDATE profiles p
SET full_name = 'Jabeer'
FROM auth.users u
WHERE u.id = p.id AND u.email = 'sayedjabir33@gmail.com';
```

After running the migration, verify that names show correctly in the sidebar footer (should show "Jabeer" not "New User").

---

### A2 — Verify App Runs Clean

After the SQL migration:

1. Start the dev server: `cd 01_CRM_AND_TOOL/fmos && npm run dev`
2. Open `localhost:3000` in browser
3. Log in as Jabeer (admin)
4. Confirm:
   - Sidebar shows "Jabeer" in the bottom user area (not "New User")
   - No "2 issues" badge in the bottom-left of the screen
   - `/admin` dashboard loads without errors
   - `/tasks` page loads without errors
   - `/sales` page loads without errors

If you see TypeScript errors in the browser overlay, run `npx tsc --noEmit` and fix them before proceeding.

---

### A3 — Remove the Old Unused Sidebar (nav-sidebar.tsx)

`components/layout/nav-sidebar.tsx` is an old sidebar component no longer used by the live app (the live app uses `components/ui/app-sidebar.tsx`). The `app-shell.tsx` that uses it is also not used in any live route.

**Action:**
- Confirm neither `nav-sidebar.tsx` nor `app-shell.tsx` is imported anywhere in the `app/` directory
- If confirmed unused: delete both files
- If they are used somewhere unexpected: do not delete — leave them and note it

---

## 5. Completion Checklist

Before marking Phase A complete, verify every item:

- [ ] SQL migration run — `full_name` column exists in profiles table
- [ ] All 4 user profiles have correct full_name set (Jabeer, Afifa, Zaid, Sufiyan)
- [ ] Sidebar shows real name instead of "New User"
- [ ] "2 issues" overlay gone from browser
- [ ] `/admin` dashboard loads clean
- [ ] `/tasks` loads clean
- [ ] `/sales` loads clean
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `nav-sidebar.tsx` and `app-shell.tsx` confirmed unused and deleted (or noted if still in use)

**Once all items are checked: Phase A is complete. Proceed to Phase B.**
