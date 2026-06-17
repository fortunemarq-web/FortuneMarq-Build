> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# PHASE 4 — Client Onboarding & Agreement Fixes
**Priority: HIGH — New clients have empty onboarding tabs, agreement timing is wrong**
**Estimated effort: 2–3 hours**
**Depends on: Phase 1 complete**

---

## Objective
Fix 4 issues so that:
1. The agreement generator properly confirms proposals (not too early)
2. New clients automatically get their onboarding tasks generated
3. New clients get their `package_tier` and `services_active` set correctly
4. The client profile shows the new Phase D onboarding tab instead of the old simple checklist

---

## Fix 1 — Agreement generator marks proposal "confirmed" too early

**File:** `components/proposals/agreement-generator.tsx`

**Problem:** The proposal status updates to `"confirmed"` on Step 1 (Generate Agreement), before the client has actually confirmed. It should only update on Step 2 (Client Confirms).

**Find the `generateAgreement()` function** — it will contain:
```typescript
await supabase
  .from("proposals")
  .update({ status: "confirmed" as any })
  .eq("id", proposal.id)
```

**Move this update** out of `generateAgreement()` and into `confirmClientAgreement()` instead. The `generateAgreement()` function should only create the agreement record with `status: "draft"`, not update the proposal.

**In `generateAgreement()`** — change the proposal update to:
```typescript
// Don't update proposal status here — wait for client confirmation
// Just create the agreement record
await supabase.from("agreements").insert({
  proposal_id: proposal.id,
  lead_id: proposal.lead_id,
  status: "draft",
  generated_at: new Date().toISOString(),
})
```

**In `confirmClientAgreement()`** — add:
```typescript
// NOW mark proposal confirmed
await supabase
  .from("proposals")
  .update({ status: "confirmed" })
  .eq("id", proposal.id)

// And update the agreement record
await supabase
  .from("agreements")
  .update({ status: "signed", signed_at: new Date().toISOString() })
  .eq("proposal_id", proposal.id)
```

---

## Fix 2 — New clients don't get onboarding tasks generated

**File:** `components/proposals/agreement-generator.tsx`

**Problem:** `confirmClientAgreement()` creates the client record and redirects, but never calls `generateClientOnboarding()`. Every new client has an empty onboarding tab.

**Find the client creation block** inside `confirmClientAgreement()`:
```typescript
const { data: newClient } = await supabase
  .from("clients")
  .insert({
    // ... client fields
  })
  .select()
  .single()

// then redirect
router.push(`/admin/clients/${newClient.id}`)
```

**Add the onboarding call between insert and redirect:**
```typescript
const { data: newClient } = await supabase
  .from("clients")
  .insert({
    business_name: proposal.lead?.company_name,
    industry: proposal.lead?.industry,
    city: proposal.lead?.city,
    contact_person: proposal.lead?.contact_person,
    phone: proposal.lead?.phone,
    status: "onboarding",
    package_tier: calculatePackageTier(proposal.total_monthly ?? proposal.monthly_value ?? 0),
    services_active: proposal.services?.map((s: { id: string }) => s.id) ?? [],
    lead_id: proposal.lead_id,
    started_at: proposal.start_date ?? new Date().toISOString(),
  })
  .select()
  .single()

if (newClient) {
  // Generate onboarding tasks for each service in the proposal
  const serviceIds = proposal.services?.map((s: { id: string }) => s.id) ?? []
  await generateClientOnboarding(supabase, newClient.id, serviceIds)
}

router.push(`/admin/clients/${newClient.id}?tab=onboarding`)
```

**Import at top of file** (add if not present):
```typescript
import { generateClientOnboarding } from "@/lib/onboarding/generateClientOnboarding"
import { calculatePackageTier } from "@/lib/performance"
```

---

## Fix 3 — New clients don't get `package_tier` or `services_active` set

**File:** `components/proposals/agreement-generator.tsx`

**Problem:** When a client is created from an agreement, `package_tier` and `services_active` are not set, so the clients list shows "—" in the package column and no service chips.

This is solved by the client insert in Fix 2 above — the insert now includes:
```typescript
package_tier: calculatePackageTier(proposal.total_monthly ?? proposal.monthly_value ?? 0),
services_active: proposal.services?.map((s: { id: string }) => s.id) ?? [],
```

**Verify `calculatePackageTier()` exists at `lib/performance.ts`** and accepts a monthly MRR value returning one of `'starter' | 'growth' | 'pro' | 'enterprise'`. If it doesn't exist, create it:

```typescript
// lib/performance.ts — add this function
export function calculatePackageTier(monthlyMrr: number): string {
  if (monthlyMrr >= 50000) return "enterprise"
  if (monthlyMrr >= 25000) return "pro"
  if (monthlyMrr >= 10000) return "growth"
  return "starter"
}
```

---

## Fix 4 — Client profile Onboarding tab uses old `onboarding_checklists` table

**Files to edit:**
- `components/admin/clients/ClientProfileTabs.tsx`
- `app/admin/clients/[id]/page.tsx`

**Problem:** The new Phase D onboarding component at `components/clients/onboarding-tab.tsx` is built and correct, but the client profile still imports and shows the old `OnboardingTab` from `components/admin/clients/tabs/OnboardingTab.tsx` which reads from the deprecated `onboarding_checklists` table.

**Step 4a — In `ClientProfileTabs.tsx`:**

Find the existing onboarding tab import:
```typescript
import OnboardingTab from "./tabs/OnboardingTab"
// or similar path
```
Replace with:
```typescript
import { OnboardingTab } from "@/components/clients/onboarding-tab"
```

**Step 4b — In `app/admin/clients/[id]/page.tsx`:**

Find the data fetch for the client profile. Add fetches for the new tables:
```typescript
// Add alongside existing fetches
const [
  { data: client },
  { data: onboardingTasks },
  { data: assetVault },
] = await Promise.all([
  supabase.from("clients").select("*, lead:leads(*)").eq("id", params.id).single(),
  supabase.from("client_onboarding_tasks").select("*").eq("client_id", params.id).order("service_id"),
  supabase.from("client_asset_vault").select("*").eq("client_id", params.id).order("category"),
])
```

**Step 4c — Pass the new props to ClientProfileTabs:**
```tsx
<ClientProfileTabs
  client={client}
  initialTasks={onboardingTasks ?? []}
  initialAssets={assetVault ?? []}
  // ... other existing props
/>
```

**Step 4d — Update `ClientProfileTabs.tsx`** to pass `initialTasks` and `initialAssets` to the new `OnboardingTab`:
```tsx
<OnboardingTab
  clientId={client.id}
  initialTasks={initialTasks}
  initialAssets={initialAssets}
/>
```

---

## Fix 5 — Agreement confirmation redirects to wrong tab

**File:** `components/proposals/agreement-generator.tsx`

After creating the client and calling `generateClientOnboarding()`, redirect to the client profile with the onboarding tab open:
```typescript
router.push(`/admin/clients/${newClient.id}?tab=onboarding`)
```

Ensure the client profile reads the `tab` query param and opens the correct tab on load.

---

## Verification Checklist

- [ ] Generate Agreement → proposal status stays `"sent"` (not prematurely `"confirmed"`)
- [ ] Client Confirms → proposal status becomes `"confirmed"`
- [ ] Client Confirms → agreement record created with `status: "signed"`
- [ ] Client Confirms → new client has `status: "onboarding"` (not "active")
- [ ] New client has `package_tier` set (not "—")
- [ ] New client has `services_active` array populated from proposal services
- [ ] New client has onboarding tasks generated (visible in `client_onboarding_tasks` table)
- [ ] Client profile Onboarding tab shows tasks grouped by service (not old checklist)
- [ ] Redirected to client profile with Onboarding tab open after confirmation
- [ ] `npm run build` passes
