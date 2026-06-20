"use client";

import { useState, useEffect } from "react";
import type { ClientRecord } from "@/app/admin/clients/actions";
import { updateClientNotes, updateClientField } from "@/app/admin/clients/actions";
import { Calendar, FolderKanban, FileText, Save, Loader2, Zap, Check } from "lucide-react";
import { promptModal } from "@/components/ui/prompt-modal";
import ActivityTimeline from "@/components/ActivityTimeline";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

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
      const ok = await promptModal({ title: `Mark ${client.business_name} as upsell eligible?`, description: "This will flag them on the dashboard for upsell outreach.", confirmLabel: "Mark Eligible", type: "select", options: [{ value: "confirm", label: "Yes, flag for upsell" }] });
      if (ok) {
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Summary Card */}
      <Card className="p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-line py-2">
            <span className="text-xs text-slate-500">Days as Client</span>
            <span className="text-sm font-semibold tabular-nums text-slate-800">
              {daysAsClient}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-line py-2">
            <span className="text-xs text-slate-500">Active Projects</span>
            <span className="text-sm font-semibold tabular-nums text-slate-800">
              {projects.filter((p) => p.status !== "completed").length}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-line py-2">
            <span className="text-xs text-slate-500">Monthly Value</span>
            <span className="text-sm font-semibold tabular-nums text-brand-deep">
              ₹{(client.monthly_value ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          {client.services_active && client.services_active.length > 0 && (
            <div className="border-b border-line py-2">
              <p className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Active Services</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {client.services_active.map((service: string) => (
                  <Badge key={service} tone="brand" variant="outline" size="sm" className="uppercase">
                    {service.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500">Onboarding</span>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                client.onboarding_completed ? "text-brand-deep" : "text-warn"
              )}
            >
              {client.onboarding_completed ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Complete
                </>
              ) : (
                "In Progress"
              )}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-line-strong py-2 pt-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Zap className="h-3.5 w-3.5 text-warn" /> Upsell Eligible
            </span>
            <button
              onClick={toggleUpsell}
              disabled={togglingUpsell}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2",
                client.upsell_eligible ? "bg-brand" : "bg-slate-200",
                togglingUpsell && "opacity-50"
              )}
            >
              <span className="sr-only">Toggle Upsell Eligibility</span>
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  client.upsell_eligible ? "translate-x-2" : "-translate-x-2"
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Active Projects */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FolderKanban className="h-3.5 w-3.5" />
          Active Projects
        </h3>
        {projects.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-400">
            No projects yet
          </p>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => {
              const statusTone: Tone =
                p.status === "completed"
                  ? "brand"
                  : p.status === "in_progress"
                  ? "info"
                  : "neutral";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-line p-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {p.service_type?.replace(/_/g, " ") ?? "Project"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-[11px] text-slate-400">
                        {p.deadline
                          ? new Date(p.deadline).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "No deadline"}
                      </span>
                    </div>
                  </div>
                  <Badge tone={statusTone} size="sm" className="uppercase">
                    {p.status?.replace(/_/g, " ") ?? "—"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Activity + Notes */}
      <div className="space-y-6">
        {/* Activity Feed */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="h-3.5 w-3.5" />
            Recent Activity
          </h3>
          {activityFeed.length === 0 ? (
            <p className="py-4 text-center text-sm italic text-slate-400">
              No recent activity
            </p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {activityFeed.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="border-l-2 border-line-strong py-1 pl-3"
                >
                  <p className="text-xs font-medium text-slate-700">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
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
        </Card>

        {/* Full Activity Trail (audit triggers + activity events) */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Zap className="h-3.5 w-3.5" />
            Activity Trail
          </h3>
          <ActivityTimeline entityType="client" entityId={client.id} compact limit={8} />
        </Card>

        {/* Notes */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </h3>
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-brand-deep"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saved ? (
                <span className="flex items-center gap-1 text-brand-deep">
                  <Check className="h-3 w-3" /> Saved
                </span>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Ctrl+S
                </>
              )}
            </button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none bg-slate-50"
            placeholder="Add notes about this client..."
          />
        </Card>
      </div>
    </div>
  );
}
