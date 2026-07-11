"use client";

import { useState, useTransition } from "react";
import {
  Flag, CalendarDays, UserRound, CheckCircle2, Circle, Loader2,
  Link2, Film, Scissors, BadgeCheck, ChevronDown, ChevronRight,
} from "lucide-react";
import { setTaskStatus, setTaskDriveLinks, completeMilestone } from "@/actions/delivery";
import { toast } from "@/components/ui/toast";
import { Badge, type Tone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export interface BoardMilestone {
  id: string;
  name: string;
  due_date: string | null;
  status: string | null;
  client_notified_at?: string | null;
}

export interface BoardTask {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
  milestone_id: string | null;
  description: string | null;
  drive_raw_url: string | null;
  drive_edited_url: string | null;
  drive_final_url: string | null;
  assigned_profile?: { full_name: string | null } | null;
}

const MS_STATUS: Record<string, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  ready_for_approval: { label: "Ready for approval", tone: "warning" },
  approved: { label: "Approved", tone: "brand" },
};

const DONE = "completed";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function DeliveryBoard({
  clientId,
  milestones,
  tasks: initialTasks,
}: {
  clientId: string;
  milestones: BoardMilestone[];
  tasks: BoardTask[];
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [ms, setMs] = useState<BoardMilestone[]>(milestones);
  const [pending, startTransition] = useTransition();
  const [editingLinks, setEditingLinks] = useState<string | null>(null);

  if (ms.length === 0) return null;

  function toggleTask(task: BoardTask) {
    const done = task.status !== DONE;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: done ? DONE : "in_progress" } : t)));
    startTransition(async () => {
      const res = await setTaskStatus({ taskId: task.id, clientId, done });
      if (!res.ok) {
        toast.error(res.error ?? "Couldn't update the task.");
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
        return;
      }
      if (res.milestone?.complete && task.milestone_id) {
        setMs((prev) => prev.map((m) => (m.id === task.milestone_id ? { ...m, status: "approved" } : m)));
      }
      if (res.notified) toast.success("Milestone complete — client notified on WhatsApp.");
    });
  }

  function markComplete(milestoneId: string) {
    startTransition(async () => {
      const res = await completeMilestone({ milestoneId, clientId, force: true });
      if (!res.ok) { toast.error(res.error ?? "Couldn't complete the milestone."); return; }
      setMs((prev) => prev.map((m) => (m.id === milestoneId ? { ...m, status: "approved" } : m)));
      toast.success(res.notified ? "Milestone complete — client notified on WhatsApp." : "Milestone marked complete.");
    });
  }

  function saveLinks(task: BoardTask, raw: string, edited: string, final: string) {
    setTasks((prev) => prev.map((t) => (t.id === task.id
      ? { ...t, drive_raw_url: raw || null, drive_edited_url: edited || null, drive_final_url: final || null } : t)));
    setEditingLinks(null);
    startTransition(async () => {
      const res = await setTaskDriveLinks({ taskId: task.id, clientId, raw, edited, final });
      if (!res.ok) toast.error(res.error ?? "Couldn't save links.");
    });
  }

  return (
    <div className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Delivery Plan</p>
      <div className="space-y-3">
        {ms.map((m) => {
          const mTasks = tasks.filter((t) => t.milestone_id === m.id);
          const done = mTasks.filter((t) => t.status === DONE).length;
          const allDone = mTasks.length > 0 && done === mTasks.length;
          const st = MS_STATUS[m.status ?? "not_started"] ?? MS_STATUS.not_started;
          const isApproved = m.status === "approved";

          return (
            <Card key={m.id} className="overflow-hidden">
              {/* Milestone header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-line">
                <div className="flex items-center gap-2 min-w-0">
                  <Flag className="h-3.5 w-3.5 text-brand-deep shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 truncate">{m.name}</span>
                  <Badge tone={st.tone} size="sm" className="shrink-0">{st.label}</Badge>
                  {m.client_notified_at && (
                    <span className="text-[11px] font-semibold text-brand-deep flex items-center gap-0.5 shrink-0" title="Client notified on WhatsApp">
                      <BadgeCheck className="h-3 w-3" /> notified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[11px] font-semibold tabular-nums text-slate-400">{done}/{mTasks.length} done</span>
                  {m.due_date && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <CalendarDays className="h-3 w-3" />{fmtDate(m.due_date)}
                    </span>
                  )}
                  {!isApproved && (
                    <button
                      onClick={() => markComplete(m.id)}
                      disabled={pending}
                      title={allDone ? "All tasks done — notify client" : "Force-complete this milestone"}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-slate-50">
                {mTasks.length === 0 ? (
                  <p className="px-4 py-2.5 text-xs text-slate-400 italic">No tasks</p>
                ) : (
                  mTasks.map((t) => {
                    const owner = (t.assigned_profile as { full_name: string } | null)?.full_name
                      ?? (t.description?.startsWith("Owner: ") ? t.description.slice(7) : null);
                    const isDone = t.status === DONE;
                    const hasLinks = t.drive_raw_url || t.drive_edited_url || t.drive_final_url;
                    const isEditing = editingLinks === t.id;
                    return (
                      <div key={t.id} className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <button onClick={() => toggleTask(t)} disabled={pending} className="flex items-center gap-2 min-w-0 text-left">
                            {isDone ? <CheckCircle2 className="h-4 w-4 text-brand shrink-0" /> : <Circle className="h-4 w-4 text-slate-700 shrink-0" />}
                            <span className={`text-sm ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>{t.title}</span>
                          </button>
                          <div className="flex items-center gap-3 shrink-0">
                            {owner && <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium"><UserRound className="h-3 w-3" />{owner}</span>}
                            {t.due_date && <span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{fmtDate(t.due_date)}</span>}
                            <button
                              onClick={() => setEditingLinks(isEditing ? null : t.id)}
                              className={`flex items-center gap-1 text-[11px] font-semibold ${hasLinks ? "text-brand-deep" : "text-slate-400"} hover:text-slate-700`}
                            >
                              <Link2 className="h-3 w-3" />
                              {hasLinks ? "Links" : "Add links"}
                              {isEditing ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Drive link chips when set + collapsed */}
                        {hasLinks && !isEditing && (
                          <div className="flex items-center gap-2 mt-1.5 ml-6">
                            <LinkChip icon={Film} label="Raw" url={t.drive_raw_url} />
                            <LinkChip icon={Scissors} label="Edited" url={t.drive_edited_url} />
                            <LinkChip icon={BadgeCheck} label="Final" url={t.drive_final_url} />
                          </div>
                        )}

                        {isEditing && <LinkEditor task={t} onSave={saveLinks} onCancel={() => setEditingLinks(null)} />}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LinkChip({ icon: Icon, label, url }: { icon: typeof Film; label: string; url: string | null }) {
  if (!url) return <span className="flex items-center gap-1 text-[11px] text-slate-700"><Icon className="h-3 w-3" />{label}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:underline">
      <Icon className="h-3 w-3" />{label}
    </a>
  );
}

function LinkEditor({
  task, onSave, onCancel,
}: {
  task: BoardTask;
  onSave: (t: BoardTask, raw: string, edited: string, final: string) => void;
  onCancel: () => void;
}) {
  const [raw, setRaw] = useState(task.drive_raw_url ?? "");
  const [edited, setEdited] = useState(task.drive_edited_url ?? "");
  const [final, setFinal] = useState(task.drive_final_url ?? "");

  const row = (label: string, val: string, set: (v: string) => void, Icon: typeof Film) => (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 w-14 shrink-0"><Icon className="h-3 w-3" />{label}</span>
      <Input value={val} onChange={(e) => set(e.target.value)} placeholder="Drive link" className="flex-1 h-8 text-xs" />
    </div>
  );

  return (
    <div className="ml-6 mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
      {row("Raw", raw, setRaw, Film)}
      {row("Edited", edited, setEdited, Scissors)}
      {row("Final", final, setFinal, BadgeCheck)}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className={buttonVariants({ variant: "ghost", size: "sm" })}>Cancel</button>
        <button onClick={() => onSave(task, raw, edited, final)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Save links</button>
      </div>
    </div>
  );
}
