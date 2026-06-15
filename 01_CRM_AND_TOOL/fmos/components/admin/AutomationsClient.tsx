"use client";

import { useState } from "react";
import { Zap, Plus, X, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  entity_type: string;
  priority: number | null;
  is_enabled: boolean | null;
}

const TRIGGER_OPTIONS = [
  "lead_stage_change",
  "lead_sla_missed",
  "lead_followup_due",
  "proposal_sent",
  "proposal_confirmed",
  "invoice_overdue",
  "client_churned",
  "meeting_booked",
  "task_overdue",
  "daily_digest",
];

const ENTITY_OPTIONS = ["lead", "proposal", "invoice", "client", "task", "system"];

const ACTION_TYPES = [
  "notify_owner",
  "notify_admin",
  "mark_stale",
  "set_status",
  "set_next_action_date",
  "assign_owner",
  "add_tag",
  "create_task",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

interface ActionDraft {
  type: ActionType;
  text: string; // message / reason / status / preset / tag / uuid / task title
  num: string; // create_task due_in_days
}

const DATE_PRESETS = ["now_plus_10min", "today_6pm", "tomorrow_9am"];

// Human hint for the value field per action type
const ACTION_HINT: Record<ActionType, string> = {
  notify_owner: "Message shown to the lead owner",
  notify_admin: "Message shown to all admins",
  mark_stale: "Reason (e.g. SLA breached — no contact)",
  set_status: "New status value (e.g. calling)",
  set_next_action_date: "Pick a preset date",
  assign_owner: "User UUID, or round_robin:<pool>",
  add_tag: "Tag to add (e.g. sla-breach)",
  create_task: "Task title",
};

function serializeAction(a: ActionDraft): { type: string; value: any } {
  switch (a.type) {
    case "notify_owner":
    case "notify_admin":
      return { type: a.type, value: { message: a.text || "Action required" } };
    case "mark_stale":
      return { type: a.type, value: { reason: a.text || "Automation Rule" } };
    case "set_next_action_date":
      return { type: a.type, value: { preset: a.text || "tomorrow_9am" } };
    case "create_task":
      return { type: a.type, value: { title: a.text || "Follow up", due_in_days: Number(a.num) || 1 } };
    default:
      return { type: a.type, value: a.text };
  }
}

export default function AutomationsClient({ initialRules }: { initialRules: AutomationRule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", trigger: "lead_stage_change", entity_type: "lead", priority: "5", throttle: "60" });
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const toggleEnabled = async (rule: AutomationRule) => {
    setSaving(rule.id);
    const next = !rule.is_enabled;
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_enabled: next } : r));
    const { error } = await supabase.from("automation_rules").update({ is_enabled: next }).eq("id", rule.id);
    if (error) {
      toast.error("Failed to update rule", error.message);
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_enabled: !next } : r));
    } else {
      toast.success(next ? "Rule activated" : "Rule paused", rule.name);
    }
    setSaving(null);
  };

  const saveEdit = async (rule: AutomationRule) => {
    setSaving(rule.id);
    const { error } = await supabase.from("automation_rules")
      .update({ name: rule.name, description: rule.description, priority: rule.priority })
      .eq("id", rule.id);
    if (error) { toast.error("Failed to save", error.message); }
    else { toast.success("Rule updated", rule.name); setEditId(null); }
    setSaving(null);
  };

  const addAction = () => setActions((prev) => [...prev, { type: "notify_owner", text: "", num: "1" }]);
  const removeAction = (i: number) => setActions((prev) => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, patch: Partial<ActionDraft>) =>
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  const resetForm = () => {
    setForm({ name: "", description: "", trigger: "lead_stage_change", entity_type: "lead", priority: "5", throttle: "60" });
    setActions([]);
  };

  const createRule = async () => {
    if (!form.name.trim()) { toast.error("Name required", ""); return; }
    if (actions.length === 0) { toast.error("Add at least one action", "A rule with no actions does nothing."); return; }
    setSaving("new");
    const { data, error } = await supabase.from("automation_rules")
      .insert({
        name: form.name,
        description: form.description || null,
        trigger: form.trigger,
        entity_type: form.entity_type,
        priority: Number(form.priority) || 5,
        throttle_minutes: Number(form.throttle) || 0,
        is_enabled: false,
        actions: actions.map(serializeAction),
        conditions: {},
      })
      .select().single();
    if (error) { toast.error("Failed to create rule", error.message); }
    else {
      setRules((prev) => [...prev, data]);
      setShowNew(false);
      resetForm();
      toast.success("Rule created", "Toggle to activate when ready.");
    }
    setSaving(null);
  };

  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {editId === rule.id ? (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={rule.name} onChange={(e) => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, name: e.target.value } : r))} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input className={inputClass} value={rule.description || ""} onChange={(e) => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, description: e.target.value } : r))} />
              </div>
              <div>
                <label className={labelClass}>Priority (lower = first)</label>
                <input type="number" className={inputClass} value={rule.priority ?? 5} onChange={(e) => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, priority: Number(e.target.value) } : r))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditId(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => saveEdit(rule)} disabled={saving === rule.id} className="flex-1 rounded-lg bg-brand-deep text-white py-2 text-sm font-semibold hover:bg-brand-active disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving === rule.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${rule.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {rule.is_enabled ? "Active" : "Paused"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{rule.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Zap className="h-3 w-3 shrink-0" />
                    <span className="font-mono">{rule.trigger}</span>
                    <span className="text-slate-300">·</span>
                    <span>{rule.entity_type}</span>
                    {rule.priority !== null && <><span className="text-slate-300">·</span><span>P{rule.priority}</span></>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleEnabled(rule)}
                  disabled={saving === rule.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${rule.is_enabled ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"} disabled:opacity-50`}
                >
                  {saving === rule.id ? <Loader2 className="h-3 w-3 animate-spin" /> : rule.is_enabled ? "Pause" : "Activate"}
                </button>
                <button onClick={() => setEditId(rule.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {rules.length === 0 && !showNew && (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No automation rules yet. Create one to get started.
        </div>
      )}

      {showNew ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center mb-1">
            <p className="font-semibold text-slate-900 text-sm">New Automation Rule</p>
            <button onClick={() => { setShowNew(false); resetForm(); }}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div>
            <label className={labelClass}>Name *</label>
            <input className={inputClass} placeholder="e.g. Alert on overdue invoice" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input className={inputClass} placeholder="Optional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Trigger</label>
              <select className={inputClass} value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}>
                {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Entity Type</label>
              <select className={inputClass} value={form.entity_type} onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}>
                {ENTITY_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Priority (lower runs first)</label>
              <input type="number" className={inputClass} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Throttle (minutes)</label>
              <input type="number" className={inputClass} value={form.throttle} onChange={(e) => setForm((f) => ({ ...f, throttle: e.target.value }))} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center mb-2">
              <label className={labelClass + " mb-0"}>Actions *</label>
              <button onClick={addAction} className="flex items-center gap-1 text-xs font-semibold text-brand-deep hover:text-brand-active">
                <Plus className="h-3 w-3" /> Add action
              </button>
            </div>
            {actions.length === 0 && (
              <p className="text-xs text-slate-400 italic">A rule must have at least one action to do anything.</p>
            )}
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                  <div className="flex-1 space-y-2">
                    <select className={inputClass} value={a.type} onChange={(e) => updateAction(i, { type: e.target.value as ActionType })}>
                      {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {a.type === "set_next_action_date" ? (
                      <select className={inputClass} value={a.text || "tomorrow_9am"} onChange={(e) => updateAction(i, { text: e.target.value })}>
                        {DATE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <input className={inputClass} placeholder={ACTION_HINT[a.type]} value={a.text} onChange={(e) => updateAction(i, { text: e.target.value })} />
                    )}
                    {a.type === "create_task" && (
                      <input type="number" className={inputClass} placeholder="Due in days" value={a.num} onChange={(e) => updateAction(i, { num: e.target.value })} />
                    )}
                  </div>
                  <button onClick={() => removeAction(i)} className="p-1.5 text-slate-400 hover:text-red-500" title="Remove action">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowNew(false); resetForm(); }} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={createRule} disabled={saving === "new"} className="flex-1 rounded-lg bg-brand-deep text-white py-2 text-sm font-semibold hover:bg-brand-active disabled:opacity-50 flex items-center justify-center gap-2">
              {saving === "new" && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Rule
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-brand-deep hover:text-brand-deep transition-colors">
          <Plus className="h-4 w-4" /> New Rule
        </button>
      )}
    </div>
  );
}
