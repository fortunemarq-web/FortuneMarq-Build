> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# PHASE 6 — WhatsApp Audit Trail & UI Polish
**Priority: MEDIUM**
**Estimated effort: 2–3 hours**
**Depends on: Phase 1 complete (outreach_logs table must exist)**

---

## Objective
Add the "Mark as Sent" audit trail to the WhatsApp template picker, fix miscellaneous UI issues across the app, and ensure every user-facing action creates the correct log entry in `outreach_logs`.

---

## Fix 1 — Add "Mark as Sent" button to WhatsApp template picker

**File:** `components/sales/whatsapp-template-picker.tsx`

**Problem:** The picker only has "Copy Message". No audit trail is created. The PDF Log and outreach history have no record of WhatsApp messages sent.

**Step 1a — Add state for sent confirmation:**
```typescript
const [justSent, setJustSent] = useState(false)
```

**Step 1b — Add a `markAsSent()` function:**
```typescript
const markAsSent = async () => {
  if (!selectedTemplate || !leadId || !actorId) return

  const { error } = await supabase.from("outreach_logs").insert({
    lead_id: leadId,
    touch_type: "whatsapp_sent",
    outcome: selectedTemplate.name,
    pdf_name: null,
    notes: `Template: ${selectedTemplate.name}`,
    actor_id: actorId,
  })

  if (!error) {
    setJustSent(true)
    onSent?.() // fire callback to parent if provided
    setTimeout(() => setJustSent(false), 3000)
  }
}
```

**Step 1c — Add the button alongside "Copy Message":**
```tsx
<div className="flex gap-2 mt-3">
  <button
    onClick={copyToClipboard}
    className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
  >
    Copy Message
  </button>
  <button
    onClick={markAsSent}
    className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
      justSent
        ? "bg-green-500 text-white"
        : "bg-[#42CA80] text-white hover:bg-green-600"
    }`}
  >
    {justSent ? "✓ Logged!" : "Mark as Sent"}
  </button>
</div>
```

**Step 1d — Ensure the parent passes `leadId` and `actorId` props** to the WhatsAppTemplatePicker wherever it's used. Check all usages of the component and add these props.

**Step 1e — Update the component's prop types:**
```typescript
interface WhatsAppTemplatePickerProps {
  leadId: string
  actorId: string
  industry: string
  outreachStage?: string
  onSent?: () => void
}
```

---

## Fix 2 — Outreach history timeline on Lead Profile should show WhatsApp logs

**File:** `components/admin/leads/[id]/lead-profile-admin-client.tsx` or similar

**Problem:** The outreach history timeline reads from `outreach_logs` but may not show `touch_type = 'whatsapp_sent'` entries properly (missing icon or label).

**Find the timeline item renderer** and ensure all touch types have correct labels and icons:

```typescript
const touchTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  call:           { label: "Call", icon: "📞", color: "text-blue-600" },
  whatsapp_sent:  { label: "WhatsApp Sent", icon: "💬", color: "text-green-600" },
  pdf_sent:       { label: "PDF Sent", icon: "📄", color: "text-purple-600" },
  follow_up:      { label: "Follow-up", icon: "🔄", color: "text-orange-600" },
  meeting_booked: { label: "Meeting Booked", icon: "📅", color: "text-indigo-600" },
  email_sent:     { label: "Email Sent", icon: "✉️", color: "text-slate-600" },
}
```

---

## Fix 3 — Lead Profile "Edit Lead" links to wrong route

**File:** `components/admin/leads/[id]/lead-profile-admin-client.tsx` (or the admin lead profile page)

**Problem:** "Edit Lead" button links to `/sales/leads/${lead.id}` (telecaller route) instead of opening an edit modal.

**Option A (preferred) — Open an inline edit modal:**
Add an `isEditing` state and render an edit form as a slide-over panel.

**Option B (quick fix) — Fix the route:**
```typescript
// BEFORE
href={`/sales/leads/${lead.id}`}
// AFTER — link to admin leads page which is the correct admin route
href={`/admin/leads/${lead.id}`}
```

If an edit modal doesn't exist yet, go with Option B for now and add a note to build the modal in a future phase.

---

## Fix 4 — Telecaller cockpit: "INTERESTED — Send Info" outcome also needs WhatsApp template option

**File:** `components/sales/telecaller-cockpit.tsx`

**Problem:** When Afifa says she'll send info, she needs to optionally log a WhatsApp message AND a PDF. Currently only the PDF selection is shown (Phase 3 Fix 5).

**Add a WhatsApp template option alongside the PDF picker:**
```tsx
{selectedOutcome?.id === "INTERESTED_SEND_INFO" && (
  <div className="mt-3 space-y-3">
    {/* PDF selection — from Phase 3 Fix 5 */}
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm font-medium text-blue-800 mb-2">PDF to send:</p>
      {/* ... PDF options */}
    </div>

    {/* WhatsApp template */}
    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
      <p className="text-sm font-medium text-green-800 mb-2">Send via WhatsApp?</p>
      <WhatsAppTemplatePicker
        leadId={selectedLead.id}
        actorId={user.id}
        industry={selectedLead.industry}
        outreachStage="pdf_sent"
        onSent={() => {/* WhatsApp was sent */}}
      />
    </div>
  </div>
)}
```

---

## Fix 5 — Ensure all admin pages use consistent heading style

**Problem:** `app/admin/automations/page.tsx` and `app/admin/briefing/page.tsx` use non-standard heading styles (`text-4xl font-mono tabular-nums`).

**Standard heading style across the app:**
```typescript
// Page title
<h1 className="text-2xl font-bold text-slate-900">Page Title</h1>

// Section title
<h2 className="text-lg font-semibold text-slate-800">Section</h2>

// KPI number
<span className="text-3xl font-bold text-slate-900">₹12,500</span>
```

**Audit these files for non-standard headings and fix:**
- `app/admin/automations/page.tsx`
- `app/admin/briefing/page.tsx`
- `app/admin/marketing/page.tsx`
- `app/admin/operations/page.tsx`

---

## Fix 6 — Verify no-answer outcome increments a count on the lead

**File:** `components/sales/telecaller-cockpit.tsx`

**Problem:** The spec says `no_answer_count` should be incremented on the lead when the outcome is NO_ANSWER. This column may not exist yet.

**Step 6a — Add the column** (run in Supabase SQL Editor):
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_answer_count INTEGER DEFAULT 0;
```

**Step 6b — In the outcome logging function**, when `outcome.id === "NO_ANSWER"`, add:
```typescript
// Increment no_answer_count
await supabase.rpc("increment_no_answer_count", { lead_uuid: selectedLead.id })
// Or as a simple update:
await supabase
  .from("leads")
  .update({ no_answer_count: (selectedLead.no_answer_count ?? 0) + 1 })
  .eq("id", selectedLead.id)
```

**Step 6c — Show the count** in the telecaller lead card as a warning badge:
```tsx
{lead.no_answer_count >= 3 && (
  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
    {lead.no_answer_count}× no answer
  </span>
)}
```

---

## Fix 7 — Notifications: verify notification creation on key events

**File:** `lib/notifications.ts` and anywhere it's called

The app has a notifications system. Verify that notifications are created for:
- New meeting booked (notify Jabeer)
- New proposal sent (notify Jabeer)
- Overdue invoice (notify Jabeer — daily)
- New client confirmed (notify Jabeer)

If any of these notification triggers are missing from the action handlers, add them.

---

## Verification Checklist

- [ ] WhatsApp template picker has "Mark as Sent" button
- [ ] Clicking "Mark as Sent" creates a row in `outreach_logs` with `touch_type = 'whatsapp_sent'`
- [ ] Outreach history timeline on lead profile shows WhatsApp events with correct icon
- [ ] "Edit Lead" button on admin lead profile doesn't link to `/sales/leads/[id]`
- [ ] No-answer outcome increments `no_answer_count` on the lead
- [ ] Leads with 3+ no-answers show a warning badge in the telecaller queue
- [ ] `app/admin/automations/page.tsx` heading uses standard style
- [ ] `app/admin/briefing/page.tsx` heading uses standard style
- [ ] `npm run build` passes with zero errors
