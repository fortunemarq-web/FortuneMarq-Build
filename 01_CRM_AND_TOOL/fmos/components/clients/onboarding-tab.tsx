"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle, Clock, AlertTriangle, XCircle, Box,
  ChevronDown, ChevronUp, Upload
} from "lucide-react";
import { createClient } from "@/lib/supabase";

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

export default function OnboardingTab({ clientId, initialTasks, initialAssets, isAdmin }: OnboardingTabProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>(initialTasks);
  const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);
  const [isPending, startTransition] = useTransition();
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // Group by service
  const serviceIds = [...new Set([...tasks.map(t => t.service_id), ...assets.map(a => a.service_id)])];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "DONE").length;
  const missingRequiredAssets = assets.filter(a => a.required && a.status !== "STORED").length;
  const isComplete = totalTasks > 0 && doneTasks === totalTasks && missingRequiredAssets === 0;

  async function markTaskDone(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "DONE", completed_at: new Date().toISOString() } : t));
    await supabase.from("client_onboarding_tasks" as any).update({
      status: "DONE",
      completed_at: new Date().toISOString(),
    }).eq("id", taskId);
  }

  async function advanceAsset(assetId: string, currentStatus: AssetRecord["status"]) {
    const next = ASSET_STATUS_FLOW[currentStatus];
    if (next === currentStatus) return;
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: next } : a));
    await supabase.from("client_asset_vault" as any).update({ status: next }).eq("id", assetId);
  }

  async function activateClient() {
    await supabase.from("clients").update({ status: "active", onboarding_completed: true } as any).eq("id", clientId);
    window.location.reload();
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
      WEBSITE: "Website Building", GMB: "GMB Optimization", SEO: "SEO",
      GOOGLE_ADS: "Google Ads", META_ADS: "Meta Ads",
      WHATSAPP_MARKETING: "WhatsApp Marketing", AI_AUTOMATIONS: "AI Automations",
    };
    return map[id] || id;
  }

  if (tasks.length === 0 && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Box className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No onboarding tasks generated yet.</p>
        <p className="text-xs mt-1">Create an onboarding record when the agreement is confirmed.</p>
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
          {missingRequiredAssets > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600">{missingRequiredAssets} required asset{missingRequiredAssets > 1 ? "s" : ""} outstanding</span>
            </div>
          )}
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#42CA80] transition-all"
            style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : "0%" }}
          />
        </div>

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
                            {task.status !== "DONE" && isAdmin && (
                              <button
                                onClick={() => markTaskDone(task.id)}
                                disabled={isPending}
                                className="shrink-0 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Mark Done
                              </button>
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
