"use client";

import { useState } from "react";
import { rescheduleMeeting } from "@/actions/book-meeting";

export default function RescheduleForm({ leadId }: { leadId: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!value) { setError("Please pick a date and time."); return; }
    const picked = new Date(value);
    if (isNaN(picked.getTime())) { setError("That date doesn't look right."); return; }
    if (picked.getTime() < Date.now()) { setError("Please choose a time in the future."); return; }

    setBusy(true);
    try {
      const r = await rescheduleMeeting({ leadId, newStartIso: picked.toISOString() });
      if (!r.ok) { setError(r.error || "Could not reschedule. Please reply on WhatsApp."); setBusy(false); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please reply on WhatsApp and we'll sort it out.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
        <p className="text-emerald-800 font-semibold">You&apos;re all set! 🎉</p>
        <p className="text-sm text-emerald-700 mt-1">
          We&apos;ve updated your call and sent a fresh confirmation on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New date &amp; time</label>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-brand-deep focus:outline-none focus:ring-1 focus:ring-brand-deep"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-full rounded-lg bg-brand-deep px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Updating…" : "Confirm new time"}
      </button>
    </div>
  );
}
