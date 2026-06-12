# PHASE 3 — Telecaller Cockpit Fixes
**Priority: CRITICAL — Telecaller and outreach board are completely decoupled right now**
**Estimated effort: 3–4 hours**
**Depends on: Phase 1 complete**

---

## Objective
Fix 7 bugs in the telecaller cockpit so that:
1. Afifa's call outcomes actually move leads on the outreach board
2. Outcome names match the spec exactly
3. Unauthorised outcomes (GATEKEEPER, LANGUAGE_BARRIER) are removed
4. PDF name is logged when sending info
5. My-stats page shows real data instead of zeros

---

## Primary file: `components/sales/telecaller-cockpit.tsx`

---

## Fix 1 — CRITICAL: Outcomes write to `leads.status` instead of `leads.outreach_stage`

**Problem:** The outreach board reads `leads.outreach_stage`. The telecaller writes to `leads.status`. The two systems never talk to each other.

**Find the lead update block inside the outcome logging function** — it looks like:
```typescript
await supabase
  .from("leads")
  .update({
    status: outcome.stage,
    // possibly other fields
  })
  .eq("id", selectedLead.id)
```

**Change to:**
```typescript
await supabase
  .from("leads")
  .update({
    outreach_stage: outcome.stage === "disqualified" ? "dead" : outcome.stage,
    status: outcome.stage, // keep status in sync too
    ...(outcome.followUpDate ? { follow_up_date: outcome.followUpDate } : {}),
  })
  .eq("id", selectedLead.id)
```

**Key mapping for stage values:**
- `"disqualified"` → `outreach_stage: "dead"` (outreach board uses "dead", not "disqualified")
- `"interested_follow_up"` → `outreach_stage: "follow_up_due"`
- `"interested_book"` → `outreach_stage: "meeting_booked"`
- `"interested_send_info"` → `outreach_stage: "pdf_sent"`
- `"not_interested"` → `outreach_stage: "not_interested"`
- `"follow_back"` → `outreach_stage: "new"` (keep in queue)
- `"wrong_number"` → `outreach_stage: "dead"`
- `"no_answer"` → keep current `outreach_stage` (don't change it)

---

## Fix 2 — "INTERESTED — Send PDF" sets stage to "nurture" instead of "pdf_sent"

**Find in the OUTCOMES array:**
```typescript
{
  id: "INTERESTED_SEND_PDF",
  // ...
  stage: "nurture",
}
```
**Change to:**
```typescript
{
  id: "INTERESTED_SEND_PDF",
  // ...
  stage: "pdf_sent",
}
```

---

## Fix 3 — Remove GATEKEEPER and LANGUAGE_BARRIER outcomes

These are not in the spec. Remove the two outcome objects with ids `"GATEKEEPER"` and `"LANGUAGE_BARRIER"` from the OUTCOMES array entirely.

**The final OUTCOMES array must contain exactly 7 items:**
1. `INTERESTED_BOOK` — "Interested — Book Meeting Now"
2. `INTERESTED_FOLLOW_UP` — "Interested — Follow Up Later"
3. `INTERESTED_SEND_INFO` — "Interested — Send Info / PDF"
4. `NOT_INTERESTED` — "Not Interested"
5. `FOLLOW_BACK` — "Follow Back Later"
6. `WRONG_NUMBER` — "Wrong / Dead Number"
7. `NO_ANSWER` — "No Answer"

---

## Fix 4 — Rename outcome IDs and labels to match spec exactly

**Current → Should be:**
- `INTERESTED_CALLBACK` → rename to `INTERESTED_FOLLOW_UP`, label "Interested — Follow Up Later"
- `INTERESTED_SEND_PDF` → rename to `INTERESTED_SEND_INFO`, label "Interested — Send Info / PDF"

---

## Fix 5 — Add PDF selection modal for "INTERESTED — Send Info" outcome

**Problem:** When Afifa selects "Send Info", she should pick which PDF to send. The PDF name must be stored in `outreach_logs.pdf_name`.

**Step 5a — Add PDF list state:**
```typescript
const [showPdfModal, setShowPdfModal] = useState(false)
const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null)
```

**Step 5b — Build a static PDF name list by niche/city** (or load from the lead's niche):
```typescript
const getPdfOptions = (niche: string, city: string): string[] => {
  const nicheSlug = niche.toLowerCase().replace(/\s+/g, "_")
  const citySlug = city.toLowerCase().replace(/\s+/g, "_")
  return [
    `${citySlug}_${nicheSlug}_EN.pdf`,
    `${citySlug}_${nicheSlug}_KN.pdf`,
  ]
}
```

**Step 5c — Show PDF modal when "INTERESTED_SEND_INFO" is selected:**
```tsx
{selectedOutcome?.id === "INTERESTED_SEND_INFO" && (
  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm font-medium text-blue-800 mb-2">Select PDF to send:</p>
    <div className="flex flex-col gap-1">
      {getPdfOptions(selectedLead.industry, selectedLead.city).map(pdf => (
        <button
          key={pdf}
          onClick={() => setSelectedPdfName(pdf)}
          className={`text-left text-sm px-3 py-2 rounded border ${
            selectedPdfName === pdf
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
        >
          {pdf}
        </button>
      ))}
    </div>
    {selectedPdfName && (
      <p className="text-xs text-blue-700 mt-2">✓ Will log: {selectedPdfName}</p>
    )}
  </div>
)}
```

**Step 5d — Include `pdf_name` in the outreach_logs insert:**
```typescript
await supabase.from("outreach_logs").insert({
  lead_id: selectedLead.id,
  touch_type: "pdf_sent",
  outcome: selectedOutcome?.id ?? null,
  pdf_name: selectedOutcome?.id === "INTERESTED_SEND_INFO" ? selectedPdfName : null,
  notes: callNotes,
  actor_id: user.id,
})
```

---

## Fix 6 — Fix daily stats bar background color

**Problem:** The stats bar is `bg-white border-b`. Spec says `bg-slate-900` dark strip with white text.

**Find the stats bar container div:**
```typescript
className="bg-white border-b ..."
// or similar light background
```
**Change to:**
```typescript
className="bg-slate-900 text-white border-b border-slate-700 ..."
```

**Also change all stat value text** inside the bar from dark text colors to white:
- `text-slate-900` → `text-white`
- `text-slate-600` → `text-slate-300`
- `text-slate-500` → `text-slate-400`

---

## Fix 7 — Fix "Follow-ups" tab to actually filter by `outreach_stage = 'follow_up_due'`

**Problem:** The Follow-ups tab exists in the UI but isn't connected to real data filtering.

**Find the tab panel or queue filter logic** and ensure the follow-ups tab applies:
```typescript
.eq("outreach_stage", "follow_up_due")
.lte("follow_up_date", new Date().toISOString().split("T")[0]) // overdue or today
.order("follow_up_date", { ascending: true })
```

This should show only leads where a follow-up is due today or overdue, sorted oldest first.

---

## File to edit: `app/telecaller/my-stats/page.tsx`

## Fix 8 — My-stats page reads non-existent tables

**Problem:** Queries `telecaller_stats` and `call_logs` — neither table exists. Page always shows zero.

**Replace all queries in this file** with queries against `outreach_logs`:

```typescript
const today = new Date().toISOString().split("T")[0]

// Calls made today
const { data: callsToday } = await supabase
  .from("outreach_logs")
  .select("id, outcome, touch_type, created_at")
  .eq("actor_id", user.id)
  .eq("touch_type", "call")
  .gte("created_at", `${today}T00:00:00`)
  .lt("created_at", `${today}T23:59:59`)

// Calls this week
const weekStart = new Date()
weekStart.setDate(weekStart.getDate() - weekStart.getDay())
const { data: callsThisWeek } = await supabase
  .from("outreach_logs")
  .select("id, outcome")
  .eq("actor_id", user.id)
  .eq("touch_type", "call")
  .gte("created_at", weekStart.toISOString())

// Meetings booked today
const meetingsToday = callsToday?.filter(c => c.outcome === "INTERESTED_BOOK") ?? []

// Compute stats from these arrays:
const stats = {
  callsToday: callsToday?.length ?? 0,
  callsThisWeek: callsThisWeek?.length ?? 0,
  meetingsToday: meetingsToday.length,
  interestedToday: callsToday?.filter(c =>
    ["INTERESTED_BOOK", "INTERESTED_FOLLOW_UP", "INTERESTED_SEND_INFO"].includes(c.outcome ?? "")
  ).length ?? 0,
}
```

---

## Verification Checklist

- [ ] Log a call outcome in the telecaller cockpit → lead moves on the outreach board
- [ ] Selecting "INTERESTED_SEND_INFO" shows a PDF selection list for the lead's niche/city
- [ ] OUTCOMES array has exactly 7 items (no GATEKEEPER, no LANGUAGE_BARRIER)
- [ ] Outcome labels match spec exactly
- [ ] `outreach_logs` table gets a new row after each call logged
- [ ] `outreach_logs.pdf_name` is populated when Send Info outcome is chosen
- [ ] Daily stats bar is dark (slate-900 background, white text)
- [ ] My-stats page shows real call counts from `outreach_logs`
- [ ] `npm run build` passes
