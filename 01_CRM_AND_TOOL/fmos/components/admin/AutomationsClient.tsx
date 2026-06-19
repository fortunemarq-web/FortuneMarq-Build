"use client";

import { useState } from "react";
import { Zap, Plus, X, Loader2, Trash2, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
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
  "lead_outcome_logged",
  "lead_sla_missed",
  "lead_followup_due",
  "meeting_booked",
  "proposal_sent",
  "proposal_confirmed",
  "lead_won",
  "invoice_overdue",
  "client_churned",
  "task_overdue",
  "daily_digest",
];

const ENTITY_OPTIONS = ["lead", "proposal", "invoice", "client", "task", "system"];

const ACTION_TYPES = [
  "notify_owner",
  "notify_admin",
  "send_whatsapp",
  "mark_stale",
  "set_status",
  "set_next_action_date",
  "assign_owner",
  "add_tag",
  "create_task",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

// WhatsApp send config (only used when type === "send_whatsapp")
const WA_AUDIENCES = ["lead", "client", "admin", "staff"] as const;
type WaAudience = (typeof WA_AUDIENCES)[number];

interface ActionDraft {
  type: ActionType;
  text: string; // message / reason / status / preset / tag / uuid / task title
  num: string; // create_task due_in_days
  // send_whatsapp config
  waAudience: WaAudience;
  waTemplate: string; // flat approved template name
  waByLeadType: boolean; // pick template by A/B/C/D
  waTplA: string;
  waTplB: string;
  waTplC: string;
  waTplD: string;
  waParams: string; // body params, one per line (e.g. {contact_person})
  waHeadline: string; // admin/staff generic templates → {{1}}
  waDetail: string; // admin/staff generic templates → {{2}}
}

function newAction(): ActionDraft {
  return {
    type: "notify_owner", text: "", num: "1",
    waAudience: "lead", waTemplate: "", waByLeadType: false,
    waTplA: "", waTplB: "", waTplC: "", waTplD: "",
    waParams: "", waHeadline: "", waDetail: "",
  };
}

const DATE_PRESETS = ["now_plus_10min", "today_6pm", "tomorrow_9am"];

// Human hint for the value field per action type
const ACTION_HINT: Record<ActionType, string> = {
  notify_owner: "Message shown to the lead owner",
  notify_admin: "Message shown to all admins",
  send_whatsapp: "",
  mark_stale: "Reason (e.g. SLA breached — no contact)",
  set_status: "New status value (e.g. calling)",
  set_next_action_date: "Pick a preset date",
  assign_owner: "User UUID, or round_robin:<pool>",
  add_tag: "Tag to add (e.g. sla-breach)",
  create_task: "Task title",
};

// Condition builder — route a rule by entity fields (e.g. last_outcome)
const CONDITION_FIELDS = [
  "last_outcome",
  "outreach_stage",
  "status",
  "lead_type",
  "city",
  "industry",
  "has_website",
  "serp_ranked",
  "phone",
];
const CONDITION_OPS = ["eq", "neq", "in", "nin", "contains", "is_null", "not_null"];
// The 9 telecaller outcomes (source: OUTCOMES in telecaller-cockpit.tsx) — suggested
// values when routing on last_outcome.
const OUTCOME_VALUES = [
  "INTERESTED_BOOK",
  "INTERESTED_FOLLOW_UP",
  "INTERESTED_SEND_INFO",
  "NOT_INTERESTED",
  "FOLLOW_BACK",
  "WRONG_NUMBER",
  "NO_ANSWER",
  "GATEKEEPER",
  "LANGUAGE_BARRIER",
];

interface ConditionDraft {
  field: string;
  op: string;
  value: string;
}

function serializeConditions(conds: ConditionDraft[]): any {
  const all = conds
    .filter((c) => c.field && c.op)
    .map((c) => {
      const cond: any = { field: c.field, op: c.op };
      if (c.op === "is_null" || c.op === "not_null") return cond;
      if (c.op === "in" || c.op === "nin") {
        cond.value = c.value.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        const v = c.value.trim();
        cond.value = v === "true" ? true : v === "false" ? false : v;
      }
      return cond;
    });
  return all.length ? { all } : {};
}

function serializeAction(a: ActionDraft): { type: string; value: any } {
  switch (a.type) {
    case "notify_owner":
    case "notify_admin":
      return { type: a.type, value: { message: a.text || "Action required" } };
    case "send_whatsapp": {
      const audience = a.waAudience || "lead";
      const cfg: any = { audience, lang: "en" };
      if (audience === "admin" || audience === "staff") {
        // Generic internal templates ride on headline + detail (exactly 2 params).
        cfg.headline = a.waHeadline || "";
        cfg.detail = a.waDetail || "";
      } else {
        if (a.waByLeadType) {
          const map: any = {};
          if (a.waTplA) map.A = a.waTplA;
          if (a.waTplB) map.B = a.waTplB;
          if (a.waTplC) map.C = a.waTplC;
          if (a.waTplD) map.D = a.waTplD;
          cfg.leadTypeTemplates = map;
        } else {
          cfg.template = a.waTemplate || "";
        }
        const params = (a.waParams || "").split("\n").map((s) => s.trim()).filter(Boolean);
        if (params.length) cfg.params = params;
      }
      return { type: "send_whatsapp", value: cfg };
    }
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

// Reverse of serializeConditions — load a stored { all: [...] } back into drafts.
function deserializeConditions(json: any): ConditionDraft[] {
  const all = json?.all;
  if (!Array.isArray(all)) return [];
  return all.map((c: any) => ({
    field: c.field || "last_outcome",
    op: c.op || "eq",
    value: Array.isArray(c.value)
      ? c.value.join(", ")
      : c.value === true ? "true" : c.value === false ? "false" : (c.value ?? "").toString(),
  }));
}

// Reverse of serializeAction — load a stored { type, value } back into an ActionDraft.
function deserializeAction(a: any): ActionDraft {
  const base = newAction();
  const type = (ACTION_TYPES as readonly string[]).includes(a?.type) ? (a.type as ActionType) : "notify_owner";
  base.type = type;
  const v = a?.value;
  switch (type) {
    case "notify_owner":
    case "notify_admin":
      base.text = v?.message || "";
      break;
    case "send_whatsapp":
      base.waAudience = (v?.audience || "lead") as WaAudience;
      if (v?.headline || v?.detail) { base.waHeadline = v.headline || ""; base.waDetail = v.detail || ""; }
      if (v?.leadTypeTemplates) {
        base.waByLeadType = true;
        base.waTplA = v.leadTypeTemplates.A || "";
        base.waTplB = v.leadTypeTemplates.B || "";
        base.waTplC = v.leadTypeTemplates.C || "";
        base.waTplD = v.leadTypeTemplates.D || "";
      } else {
        base.waTemplate = v?.template || "";
      }
      if (Array.isArray(v?.params)) base.waParams = v.params.join("\n");
      break;
    case "mark_stale":
      base.text = v?.reason || "";
      break;
    case "set_next_action_date":
      base.text = v?.preset || "tomorrow_9am";
      break;
    case "create_task":
      base.text = v?.title || "";
      base.num = String(v?.due_in_days ?? 1);
      break;
    default:
      base.text = typeof v === "string" ? v : (v?.toString?.() || "");
      break;
  }
  return base;
}

export default function AutomationsClient({ initialRules, templates = [] }: { initialRules: AutomationRule[]; templates?: string[] }) {
  const [rules, setRules] = useState(initialRules);
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFullId, setEditFullId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", trigger: "lead_stage_change", entity_type: "lead", priority: "5", throttle: "60" });
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const [conditions, setConditions] = useState<ConditionDraft[]>([]);
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

  // Load a rule's full config (trigger/entity/conditions/actions/throttle) into the
  // form for editing. The rule-list query only has summary fields, so fetch the rest.
  const openConfigure = async (rule: AutomationRule) => {
    setSaving(rule.id);
    const { data, error } = await supabase.from("automation_rules").select("*").eq("id", rule.id).single();
    setSaving(null);
    if (error || !data) { toast.error("Could not load rule", error?.message || ""); return; }
    const r: any = data;
    setForm({
      name: r.name || "",
      description: r.description || "",
      trigger: r.trigger || "lead_stage_change",
      entity_type: r.entity_type || "lead",
      priority: String(r.priority ?? 5),
      throttle: String(r.throttle_minutes ?? 0),
    });
    setConditions(deserializeConditions(r.conditions));
    setActions(Array.isArray(r.actions) ? r.actions.map(deserializeAction) : []);
    setShowNew(false);
    setEditId(null);
    setEditFullId(rule.id);
  };

  const saveFullEdit = async () => {
    if (!editFullId) return;
    if (!form.name.trim()) { toast.error("Name required", ""); return; }
    if (actions.length === 0) { toast.error("Add at least one action", "A rule with no actions does nothing."); return; }
    setSaving("edit");
    const { data, error } = await supabase.from("automation_rules")
      .update({
        name: form.name,
        description: form.description || null,
        trigger: form.trigger,
        entity_type: form.entity_type,
        priority: Number(form.priority) || 5,
        throttle_minutes: Number(form.throttle) || 0,
        actions: actions.map(serializeAction),
        conditions: serializeConditions(conditions),
      })
      .eq("id", editFullId)
      .select().single();
    setSaving(null);
    if (error) { toast.error("Failed to save rule", error.message); return; }
    setRules((prev) => prev.map((r) => r.id === editFullId ? { ...r, ...(data as any) } : r));
    setEditFullId(null);
    resetForm();
    toast.success("Rule updated", form.name);
  };

  const deleteRule = async (rule: AutomationRule) => {
    const ok = await promptModal({
      title: `Delete "${rule.name}"?`,
      description: "This automation rule and its run history will be permanently removed.",
      confirmLabel: "Delete",
      destructive: true,
      type: "select",
      options: [{ value: "confirm", label: "Yes, delete it" }],
    });
    if (!ok) return;
    setSaving(rule.id);
    // automation_runs has a RESTRICT FK to the rule — remove its history first.
    await supabase.from("automation_runs").delete().eq("rule_id", rule.id);
    const { error } = await supabase.from("automation_rules").delete().eq("id", rule.id);
    setSaving(null);
    if (error) { toast.error("Failed to delete", error.message); return; }
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    if (editId === rule.id) setEditId(null);
    toast.success("Rule deleted", rule.name);
  };

  const addAction = () => setActions((prev) => [...prev, newAction()]);
  const removeAction = (i: number) => setActions((prev) => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, patch: Partial<ActionDraft>) =>
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  const addCondition = () => setConditions((prev) => [...prev, { field: "last_outcome", op: "eq", value: "" }]);
  const removeCondition = (i: number) => setConditions((prev) => prev.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, patch: Partial<ConditionDraft>) =>
    setConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const resetForm = () => {
    setForm({ name: "", description: "", trigger: "lead_stage_change", entity_type: "lead", priority: "5", throttle: "60" });
    setActions([]);
    setConditions([]);
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
        conditions: serializeConditions(conditions),
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
                <button
                  onClick={() => openConfigure(rule)}
                  disabled={saving === rule.id}
                  title="Configure conditions & actions"
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving === rule.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => deleteRule(rule)}
                  disabled={saving === rule.id}
                  title="Delete rule"
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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

      {(showNew || editFullId) ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center mb-1">
            <p className="font-semibold text-slate-900 text-sm">{editFullId ? "Edit Automation Rule" : "New Automation Rule"}</p>
            <button onClick={() => { setShowNew(false); setEditFullId(null); resetForm(); }}><X className="h-4 w-4 text-slate-400" /></button>
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

          {/* Suggestions for template-name and outcome inputs */}
          <datalist id="wa-templates">
            {templates.map((t) => <option key={t} value={t} />)}
          </datalist>
          <datalist id="outcome-values">
            {OUTCOME_VALUES.map((o) => <option key={o} value={o} />)}
          </datalist>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center mb-2">
              <label className={labelClass + " mb-0"}>Conditions (optional — all must match)</label>
              <button onClick={addCondition} className="flex items-center gap-1 text-xs font-semibold text-brand-deep hover:text-brand-active">
                <Plus className="h-3 w-3" /> Add condition
              </button>
            </div>
            {conditions.length === 0 && (
              <p className="text-xs text-slate-400 italic">No conditions — the rule runs for every {form.entity_type}. Add one to route by a field (e.g. last_outcome = INTERESTED_SEND_INFO).</p>
            )}
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <select className={inputClass} value={c.field} onChange={(e) => updateCondition(i, { field: e.target.value })}>
                      {CONDITION_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select className={inputClass} value={c.op} onChange={(e) => updateCondition(i, { op: e.target.value })}>
                      {CONDITION_OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {c.op === "is_null" || c.op === "not_null" ? (
                      <span className="text-xs text-slate-400 self-center">no value</span>
                    ) : (
                      <input
                        className={inputClass}
                        list={c.field === "last_outcome" ? "outcome-values" : undefined}
                        placeholder={c.op === "in" || c.op === "nin" ? "comma,separated" : "value"}
                        value={c.value}
                        onChange={(e) => updateCondition(i, { value: e.target.value })}
                      />
                    )}
                  </div>
                  <button onClick={() => removeCondition(i)} className="p-1.5 text-slate-400 hover:text-red-500" title="Remove condition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
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
                    {a.type === "send_whatsapp" ? (
                      <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Audience</label>
                          <select className={inputClass} value={a.waAudience} onChange={(e) => updateAction(i, { waAudience: e.target.value as WaAudience })}>
                            {WA_AUDIENCES.map((au) => <option key={au} value={au}>{au}</option>)}
                          </select>
                        </div>
                        {a.waAudience === "admin" || a.waAudience === "staff" ? (
                          <>
                            <p className="text-[10px] text-slate-500">
                              Generic template <span className="font-mono">{a.waAudience === "admin" ? "admin_alert" : "staff_alert"}</span> · headline = {`{{1}}`}, detail = {`{{2}}`}. Put any link at the end of detail.
                            </p>
                            <input className={inputClass} placeholder="Headline (e.g. New hot lead)" value={a.waHeadline} onChange={(e) => updateAction(i, { waHeadline: e.target.value })} />
                            <input className={inputClass} placeholder="Detail — supports {company_name}, {city}…" value={a.waDetail} onChange={(e) => updateAction(i, { waDetail: e.target.value })} />
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                              <input type="checkbox" checked={a.waByLeadType} onChange={(e) => updateAction(i, { waByLeadType: e.target.checked })} />
                              Pick template by lead type (A/B/C/D)
                            </label>
                            {a.waByLeadType ? (
                              <div className="grid grid-cols-2 gap-2">
                                <input list="wa-templates" className={inputClass} placeholder="Type A template" value={a.waTplA} onChange={(e) => updateAction(i, { waTplA: e.target.value })} />
                                <input list="wa-templates" className={inputClass} placeholder="Type B template" value={a.waTplB} onChange={(e) => updateAction(i, { waTplB: e.target.value })} />
                                <input list="wa-templates" className={inputClass} placeholder="Type C template" value={a.waTplC} onChange={(e) => updateAction(i, { waTplC: e.target.value })} />
                                <input list="wa-templates" className={inputClass} placeholder="Type D template" value={a.waTplD} onChange={(e) => updateAction(i, { waTplD: e.target.value })} />
                              </div>
                            ) : (
                              <input list="wa-templates" className={inputClass} placeholder="Approved template name (e.g. proposal_sent)" value={a.waTemplate} onChange={(e) => updateAction(i, { waTemplate: e.target.value })} />
                            )}
                            <textarea className={inputClass} rows={3} placeholder={"Body params — one per line. Format with :date :datetime :time :inr\ne.g. {contact_person}\n{follow_up_date:datetime}\n{amount:inr}"} value={a.waParams} onChange={(e) => updateAction(i, { waParams: e.target.value })} />
                          </>
                        )}
                      </div>
                    ) : a.type === "set_next_action_date" ? (
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
            <button onClick={() => { setShowNew(false); setEditFullId(null); resetForm(); }} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={editFullId ? saveFullEdit : createRule} disabled={saving === "new" || saving === "edit"} className="flex-1 rounded-lg bg-brand-deep text-white py-2 text-sm font-semibold hover:bg-brand-active disabled:opacity-50 flex items-center justify-center gap-2">
              {(saving === "new" || saving === "edit") && <Loader2 className="h-4 w-4 animate-spin" />}
              {editFullId ? "Save Changes" : "Create Rule"}
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
