"use client";

import { useState, useEffect } from "react";
import type { ClientRecord } from "@/app/admin/clients/actions";
import { updateClientNotes, updateClientField } from "@/app/admin/clients/actions";
import { Calendar, FolderKanban, FileText, Save, Loader2, Zap } from "lucide-react";
import ActivityTimeline from "@/components/ActivityTimeline";

export default function OverviewTab({
  client,
  projects,
  activityFeed,
}: {
  client: ClientRecord;
  projects: Array<{ id: string; status: string | null; deadline: string | null; service_type?: string | null }>;
  activityFeed: Array<{ id: string; title: string; body?: string | null; created_at: string | null }>;
}) {
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [togglingUpsell, setTogglingUpsell] = useState(false);

  const toggleUpsell = async () => {
    if (client.upsell_eligible) {
      setTogglingUpsell(true);
      await updateClientField(client.id, "upsell_eligible", false);
      setTogglingUpsell(false);
    } else {
      if (confirm(`Mark ${client.business_name} as upsell eligible? This will flag them on the dashboard.`)) {
        setTogglingUpsell(true);
        await updateClientField(client.id, "upsell_eligible", true);
        setTogglingUpsell(false);
      }
    }
  };

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveNotes();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notes]);

  const handleSaveNotes = async () => {
    setSaving(true);
    await updateClientNotes(client.id, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const daysAsClient = client.start_date
    ? Math.floor(
        (Date.now() - new Date(client.start_date).getTime()) / 86400000
      )
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Quick Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Days as Client</span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {daysAsClient}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Active Projects</span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {projects.filter((p) => p.status !== "completed").length}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Monthly Value</span>
            <span className="text-sm font-mono font-bold text-[#42CA80]">
              ₹{(client.monthly_value ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          {client.services_active && client.services_active.length > 0 && (
            <div className="py-2 border-b border-slate-50">
              <p className="text-xs text-slate-500 mb-1 flex justify-between items-center">
                <span>Active Services</span>
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {client.services_active.map((service: string) => (
                  <span
                    key={service}
                    className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 uppercase"
                  >
                    {service.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-500">Onboarding</span>
            <span
              className={`text-xs font-bold ${
                client.onboarding_completed
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {client.onboarding_completed ? "✓ Complete" : "In Progress"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-500" /> Upsell Eligible
            </span>
            <button
              onClick={toggleUpsell}
              disabled={togglingUpsell}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#42CA80] focus:ring-offset-2 ${
                client.upsell_eligible ? "bg-[#42CA80]" : "bg-slate-200"
              } ${togglingUpsell ? "opacity-50" : ""}`}
            >
              <span className="sr-only">Toggle Upsell Eligibility</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  client.upsell_eligible ? "translate-x-2" : "-translate-x-2"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <FolderKanban className="h-3.5 w-3.5" />
          Active Projects
        </h3>
        {projects.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">
            No projects yet
          </p>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {p.service_type?.replace(/_/g, " ") ?? "Project"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">
                      {p.deadline
                        ? new Date(p.deadline).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "No deadline"}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : p.status === "in_progress"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {p.status?.replace(/_/g, " ") ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity + Notes */}
      <div className="space-y-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Recent Activity
          </h3>
          {activityFeed.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activityFeed.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="border-l-2 border-slate-200 pl-3 py-1"
                >
                  <p className="text-xs font-medium text-slate-700">
                    {a.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(a.created_at || "").toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Activity Trail (audit triggers + activity events) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" />
            Activity Trail
          </h3>
          <ActivityTimeline entityType="client" entityId={client.id} compact limit={8} />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Notes
            </h3>
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#42CA80] transition-colors"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saved ? (
                <span className="text-[#42CA80]">✓ Saved</span>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Ctrl+S
                </>
              )}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20 resize-none"
            placeholder="Add notes about this client..."
          />
        </div>
      </div>
    </div>
  );
}
