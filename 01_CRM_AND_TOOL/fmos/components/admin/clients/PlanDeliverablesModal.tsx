"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X, ClipboardList, Loader2, AlertTriangle, ChevronRight,
  Flag, CheckCircle2, CalendarDays, UserRound,
} from "lucide-react";
import { parseMilestones } from "@/lib/delivery/parseMilestones";
import { planDeliverables } from "@/actions/plan-deliverables";
import { toast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";

const PLACEHOLDER = `Milestone: Website Live (due 2026-07-05)
- Build homepage @Zaid due 28 Jun
- Wire contact form @Sufiyan
- SEO meta + sitemap due 2026-07-02

Milestone: GMB Optimised (due 12/07/2026)
- Verify listing @Jabeer
- Add 10 photos + services`;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function PlanDeliverablesModal({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [text, setText] = useState("");
  const [saving, startSaving] = useTransition();
  const router = useRouter();

  const parsed = useMemo(() => (text.trim() ? parseMilestones(text) : null), [text]);

  function reset() {
    setText("");
    setStep("paste");
  }

  function close() {
    setOpen(false);
    reset();
  }

  function confirmSave() {
    startSaving(async () => {
      const res = await planDeliverables({ clientId, rawText: text });
      if (res.ok) {
        toast.success(
          `Planned ${res.milestonesCreated} milestone${res.milestonesCreated === 1 ? "" : "s"} · ${res.tasksCreated} task${res.tasksCreated === 1 ? "" : "s"}`
        );
        close();
        router.refresh();
      } else {
        toast.error(res.error ?? "Couldn't save the plan.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-surface hover:bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white transition-colors min-h-[36px]"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Plan Deliverables
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-surface rounded-2xl shadow-lg w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">Plan Deliverables</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step === "paste"
                    ? "Paste milestones + tasks from Cowork"
                    : "Review before saving — nothing is written yet"}
                </p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {step === "paste" ? (
                <div className="space-y-3">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={PLACEHOLDER}
                    rows={14}
                    className="font-mono rounded-xl px-4 py-3 resize-none leading-relaxed"
                  />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-500">Format:</span>{" "}
                    <code>Milestone: Name (due 2026-07-05)</code> then{" "}
                    <code>- task @owner due 28 Jun</code>.
                    Due dates &amp; <code>@owner</code> are optional. Tasks before the
                    first milestone go under <strong>General</strong>.
                  </div>
                </div>
              ) : (
                <PreviewPane parsed={parsed} />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-slate-50">
              {step === "paste" ? (
                <>
                  <span className="text-xs text-slate-400">
                    {parsed ? `${parsed.milestones.length} milestone(s) · ${parsed.taskCount} task(s)` : "Nothing parsed yet"}
                  </span>
                  <button
                    onClick={() => setStep("preview")}
                    disabled={!parsed || parsed.taskCount === 0 && parsed.milestones.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface hover:bg-white/[0.06] disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Preview <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep("paste")}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                  >
                    ← Back to edit
                  </button>
                  <button
                    onClick={confirmSave}
                    disabled={saving || !parsed || parsed.milestones.length === 0}
                    className={buttonVariants({ variant: "primary" })}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm &amp; Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewPane({ parsed }: { parsed: ReturnType<typeof parseMilestones> | null }) {
  if (!parsed) return null;
  return (
    <div className="space-y-4">
      {parsed.warnings.length > 0 && (
        <div className="rounded-xl border border-warn-line bg-warn-soft px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warn" />
            <span className="text-xs font-semibold text-warn">{parsed.warnings.length} thing{parsed.warnings.length === 1 ? "" : "s"} to note</span>
          </div>
          <ul className="space-y-1 ml-5 list-disc">
            {parsed.warnings.map((w, i) => (
              <li key={i} className="text-[11px] text-warn">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {parsed.milestones.map((m, i) => (
        <div key={i} className="rounded-xl border border-line overflow-hidden">
          <div className={`flex items-center justify-between px-4 py-2.5 ${m.isGeneral ? "bg-slate-100" : "bg-slate-50"} border-b border-line`}>
            <div className="flex items-center gap-2">
              <Flag className={`h-3.5 w-3.5 ${m.isGeneral ? "text-slate-400" : "text-brand-deep"}`} />
              <span className="text-sm font-semibold text-slate-800">{m.name}</span>
              {m.isGeneral && <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-surface border border-line rounded px-1.5 py-0.5">auto-bucket</span>}
            </div>
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.dueIso ? "text-slate-500" : "text-slate-300"}`}>
              <CalendarDays className="h-3 w-3" />
              {m.dueIso ? fmtDate(m.dueIso) : "no due date"}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {m.tasks.length === 0 ? (
              <p className="px-4 py-2.5 text-xs text-slate-400 italic">No tasks under this milestone</p>
            ) : (
              m.tasks.map((t, j) => (
                <div key={j} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60">
                  <span className="text-sm text-slate-700">{t.title}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {t.owner && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <UserRound className="h-3 w-3" />{t.owner}
                      </span>
                    )}
                    {t.dueRaw && (
                      <span className={`flex items-center gap-1 text-[11px] ${t.dueIso ? "text-slate-500" : "text-warn"}`}>
                        <CalendarDays className="h-3 w-3" />
                        {t.dueIso ? fmtDate(t.dueIso) : `? ${t.dueRaw}`}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
