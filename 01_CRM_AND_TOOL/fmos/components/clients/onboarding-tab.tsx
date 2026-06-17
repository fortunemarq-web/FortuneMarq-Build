"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Clock, AlertTriangle, XCircle, Box,
  ChevronDown, ChevronUp, Loader2, Wand2, Plus, Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { generateClientOnboarding, SERVICE_TASKS, SERVICE_ASSETS } from "@/lib/onboarding/generateClientOnboarding";

const ALL_SERVICES = [
  { id: "WEBSITE", label: "Website Building" },
  { id: "GMB", label: "GMB Optimization" },
  { id: "SEO", label: "SEO" },
  { id: "GOOGLE_ADS", label: "Google Ads" },
  { id: "META_ADS", label: "Meta Ads" },
  { id: "WHATSAPP_MARKETING", label: "WhatsApp Marketing" },
  { id: "AI_AUTOMATIONS", label: "AI Automations" },
];

// ─── Types ────────────────────────────────────────────────────
interface OnboardingTask {
  id: string;
  client_id: string;
  service_id: string;
  task_id: string;
  task: string;
  owner: string;
  due_by: string | null;
  notes: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  completed_at: string | null;
  completed_by: string | null;
}

interface AssetRecord {
  id: string;
  client_id: string;
  service_id: string;
  asset_id: string;
  asset_name: string;
  required: boolean;
  status: "NOT_COLLECTED" | "REQUESTED" | "RECEIVED" | "STORED";
  file_url: string | null;
  notes: string | null;
}

interface OnboardingTabProps {
  clientId: string;
  initialTasks: OnboardingTask[];
  initialAssets: AssetRecord[];
  isAdmin: boolean;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", icon: Clock, color: "text-slate-500", bg: "bg-slate-100" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  DONE: { label: "Done", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  BLOCKED: { label: "Blocked", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
};

const ASSET_STATUS_CONFIG = {
  NOT_COLLECTED: { label: "Not Collected", color: "text-red-600", bg: "bg-red-50" },
  REQUESTED: { label: "Requested", color: "text-amber-600", bg: "bg-amber-50" },
  RECEIVED: { label: "Received", color: "text-blue-600", bg: "bg-blue-50" },
  STORED: { label: "Stored ✓", color: "text-emerald-600", bg: "bg-emerald-50" },
};

const ASSET_STATUS_FLOW: Record<string, AssetRecord["status"]> = {
  NOT_COLLECTED: "REQUESTED",
  REQUESTED: "RECEIVED",
  RECEIVED: "STORED",
  STORED: "STORED",
};

const ALL_SERVICE_IDS = [
  "GENERAL", "WEBSITE", "GMB", "SEO",
  "GOOGLE_ADS", "META_ADS", "WHATSAPP_MARKETING", "AI_AUTOMATIONS", "CUSTOM",
];

export default function OnboardingTab({ clientId, initialTasks, initialAssets, isAdmin }: OnboardingTabProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>(initialTasks);
  const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);
  const [isPending, startTransition] = useTransition();
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskForm, setAddTaskForm] = useState({ service_id: "CUSTOM", task: "", owner: "Jabeer", due_by: "" });
  const [addingTask, setAddingTask] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Group by service
  const serviceIds = [...new Set([...tasks.map(t => t.service_id), ...assets.map(a => a.service_id)])];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "DONE").length;
  const missingRequiredAssets = assets.filter(a => a.required && a.status !== "STORED").length;
  const isComplete = totalTasks > 0 && doneTasks === totalTasks && missingRequiredAssets === 0;

  const TASK_STATUS_CYCLE: Record<OnboardingTask["status"], OnboardingTask["status"]> = {
    PENDING: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "PENDING",
    BLOCKED: "PENDING",
  };

  async function cycleTaskStatus(taskId: string, current: OnboardingTask["status"]) {
    const next = TASK_STATUS_CYCLE[current];
    const now = new Date().toISOString();
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: next, completed_at: next === "DONE" ? now : null } : t
    ));
    await supabase.from("client_onboarding_tasks").update({
      status: next,
      completed_at: next === "DONE" ? now : null,
    }).eq("id", taskId);
  }

  async function markTaskBlocked(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "BLOCKED" } : t));
    await supabase.from("client_onboarding_tasks").update({ status: "BLOCKED" }).eq("id", taskId);
  }

  async function handleGenerateOnboarding() {
    if (selectedServices.size === 0) return;
    setGenerating(true);
    try {
      await generateClientOnboarding(supabase, clientId, Array.from(selectedServices));
      // Refetch tasks + assets
      const [{ data: newTasks }, { data: newAssets }] = await Promise.all([
        supabase.from("client_onboarding_tasks").select("*").eq("client_id", clientId).order("service_id"),
        supabase.from("client_asset_vault").select("*").eq("client_id", clientId).order("category"),
      ]);
      setTasks((newTasks ?? []) as any);
      setAssets((newAssets ?? []) as any);
      setShowGeneratePanel(false);
      setSelectedServices(new Set());
    } finally {
      setGenerating(false);
    }
  }

  async function advanceAsset(assetId: string, currentStatus: AssetRecord["status"]) {
    const next = ASSET_STATUS_FLOW[currentStatus];
    if (next === currentStatus) return;
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: next } : a));
    await supabase.from("client_asset_vault").update({ status: next }).eq("id", assetId);
  }

  async function activateClient() {
    await supabase.from("clients").update({ status: "active", onboarding_completed: true } as any).eq("id", clientId);
    router.refresh();
  }

  async function addCustomTask() {
    if (!addTaskForm.task.trim()) return;
    setAddingTask(true);
    const taskId = `CUSTOM_${Date.now()}`;
    const row = {
      client_id: clientId,
      service_id: addTaskForm.service_id,
      task_id: taskId,
      task: addTaskForm.task.trim(),
      owner: addTaskForm.owner || "Jabeer",
      due_by: addTaskForm.due_by || null,
      notes: null,
      status: "PENDING" as const,
      completed_at: null,
      completed_by: null,
    };
    const { data, error } = await (supabase as any).from("client_onboarding_tasks").insert(row).select().single();
    if (!error && data) {
      setTasks(prev => [...prev, data as OnboardingTask]);
      setAddTaskForm({ service_id: "CUSTOM", task: "", owner: "Jabeer", due_by: "" });
      setShowAddTask(false);
    }
    setAddingTask(false);
  }

  function toggleService(serviceId: string) {
    setCollapsedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }

  function serviceLabel(id: string) {
    const map: Record<string, string> = {
      GENERAL: "Client Basics", WEBSITE: "Website Building", GMB: "GMB Optimization", SEO: "SEO",
      GOOGLE_ADS: "Google Ads", META_ADS: "Meta Ads",
      WHATSAPP_MARKETING: "WhatsApp Marketing", AI_AUTOMATIONS: "AI Automations",
      CUSTOM: "Custom",
    };
    return map[id] || id;
  }

  // Per-service build readiness: green when every required asset is Stored.
  function serviceReadiness(serviceAssets: AssetRecord[]) {
    const required = serviceAssets.filter((a) => a.required);
    if (required.length === 0) return null;
    const missing = required.filter((a) => a.status !== "STORED").length;
    return { ready: missing === 0, missing };
  }

  if (tasks.length === 0 && assets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
          <Box className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-semibold text-slate-600">No onboarding tasks yet</p>
          <p className="text-xs mt-1 mb-6 text-slate-400">Select services to generate the onboarding checklist</p>

          {isAdmin && (
            <div className="w-full max-w-sm px-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Select services</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {ALL_SERVICES.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServices(prev => {
                      const next = new Set(prev);
                      next.has(svc.id) ? next.delete(svc.id) : next.add(svc.id);
                      return next;
                    })}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all text-left ${
                      selectedServices.has(svc.id)
                        ? "border-[#42CA80] bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateOnboarding}
                disabled={selectedServices.size === 0 || generating}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-bold py-3 rounded-xl transition-colors"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Onboarding Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Onboarding Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">{doneTasks}/{totalTasks} tasks complete</p>
          </div>
          <div className="flex items-center gap-2">
            {missingRequiredAssets > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-600">{missingRequiredAssets} required asset{missingRequiredAssets > 1 ? "s" : ""} outstanding</span>
              </div>
            )}
            <a
              href={`/admin/clients/${clientId}/onboarding/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Download PDF
            </a>
            {isAdmin && (
              <button
                onClick={() => setShowAddTask(v => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </button>
            )}
          </div>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#42CA80] transition-all"
            style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : "0%" }}
          />
        </div>

        {/* Add task inline form */}
        {showAddTask && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Add Custom Task</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Task</label>
                <input
                  type="text"
                  value={addTaskForm.task}
                  onChange={e => setAddTaskForm(f => ({ ...f, task: e.target.value }))}
                  placeholder="e.g. Share brand logo assets"
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Section</label>
                <select
                  value={addTaskForm.service_id}
                  onChange={e => setAddTaskForm(f => ({ ...f, service_id: e.target.value }))}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                >
                  {ALL_SERVICE_IDS.map(id => (
                    <option key={id} value={id}>{serviceLabel(id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Owner</label>
                <input
                  type="text"
                  value={addTaskForm.owner}
                  onChange={e => setAddTaskForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="Jabeer"
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Due</label>
                <input
                  type="text"
                  value={addTaskForm.due_by}
                  onChange={e => setAddTaskForm(f => ({ ...f, due_by: e.target.value }))}
                  placeholder="Day 3"
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowAddTask(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={addCustomTask}
                disabled={!addTaskForm.task.trim() || addingTask}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                {addingTask ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add
              </button>
            </div>
          </div>
        )}

        {/* Complete banner */}
        {isComplete && (
          <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Onboarding Complete. Activate this client.</p>
            </div>
            <button
              onClick={activateClient}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Activate Client
            </button>
          </div>
        )}
      </div>

      {/* Service Sections */}
      {serviceIds.map(serviceId => {
        const serviceTasks = tasks.filter(t => t.service_id === serviceId);
        const serviceAssets = assets.filter(a => a.service_id === serviceId);
        const doneSvcTasks = serviceTasks.filter(t => t.status === "DONE").length;
        const isCollapsed = collapsedServices.has(serviceId);
        const readiness = serviceReadiness(serviceAssets);

        return (
          <div key={serviceId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleService(serviceId)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{serviceLabel(serviceId)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doneSvcTasks === serviceTasks.length && serviceTasks.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {doneSvcTasks}/{serviceTasks.length} tasks
                </span>
                {readiness && serviceId !== "GENERAL" && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${readiness.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {readiness.ready ? "Ready to build" : `Waiting on ${readiness.missing}`}
                  </span>
                )}
              </div>
              {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
            </button>

            {!isCollapsed && (
              <div>
                {/* Tasks */}
                {serviceTasks.length > 0 && (
                  <div>
                    <div className="px-5 pt-4 pb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {serviceTasks.map(task => {
                        const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                        const Icon = cfg.icon;
                        return (
                          <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                            <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-800"}`}>{task.task}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-400">{task.owner}</span>
                                {task.due_by && <span className="text-[10px] text-slate-400">Due: {task.due_by}</span>}
                              </div>
                              {task.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{task.notes}</p>}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => cycleTaskStatus(task.id, task.status)}
                                  title={
                                    task.status === "PENDING" ? "Start" :
                                    task.status === "IN_PROGRESS" ? "Mark Done" :
                                    "Reset to Pending"
                                  }
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                    task.status === "DONE"
                                      ? "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                      : task.status === "IN_PROGRESS"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  }`}
                                >
                                  {task.status === "PENDING" ? "▶ Start" :
                                   task.status === "IN_PROGRESS" ? "✓ Done" :
                                   task.status === "DONE" ? "↺ Reset" : "↺ Unblock"}
                                </button>
                                {task.status !== "DONE" && task.status !== "BLOCKED" && (
                                  <button
                                    onClick={() => markTaskBlocked(task.id)}
                                    title="Mark Blocked"
                                    className="text-xs font-semibold px-2 py-1.5 rounded-lg border bg-red-50 border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assets */}
                {serviceAssets.length > 0 && (
                  <div>
                    <div className="px-5 pt-4 pb-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assets to Collect</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {serviceAssets.map(asset => {
                        const cfg = ASSET_STATUS_CONFIG[asset.status];
                        const canAdvance = asset.status !== "STORED";
                        return (
                          <div key={asset.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">{asset.asset_name}</p>
                                {asset.required && (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Required</span>
                                )}
                              </div>
                              {asset.notes && <p className="text-[10px] text-slate-400 mt-0.5">{asset.notes}</p>}
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {canAdvance && isAdmin && (
                              <button
                                onClick={() => advanceAsset(asset.id, asset.status)}
                                disabled={isPending}
                                className="shrink-0 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {asset.status === "NOT_COLLECTED" ? "Mark Requested" :
                                 asset.status === "REQUESTED" ? "Mark Received" : "Mark Stored"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
