"use client";

import { useState } from "react";
import { createClientDeliverable } from "@/actions/client-deliverables";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, Clock, RotateCcw, Loader2 } from "lucide-react";

interface Deliverable {
  id: string;
  title: string;
  deliverable_type: string | null;
  status: string | null;
  file_url: string | null;
  client_feedback: string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; Icon: any }> = {
  pending_review: { label: "Awaiting client", cls: "bg-blue-50 text-blue-600", Icon: Clock },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-600", Icon: CheckCircle },
  revision_requested: { label: "Revision requested", cls: "bg-rose-50 text-rose-600", Icon: RotateCcw },
};

export default function ClientDeliverablePublisher({
  projectId,
  initialDeliverables,
}: {
  projectId: string;
  initialDeliverables: Deliverable[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Deliverable[]>(initialDeliverables);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("design");
  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) { toast.error("Add a title", "Give the deliverable a clear name."); return; }
    setBusy(true);
    try {
      const r = await createClientDeliverable({
        projectId, title, description, deliverableType: type, fileUrl,
      });
      if (!r.ok || !r.id) { toast.error("Could not publish", r.error || "Please try again."); return; }
      setItems((prev) => [
        { id: r.id!, title: title.trim(), deliverable_type: type, status: "pending_review", file_url: fileUrl || null, client_feedback: null },
        ...prev,
      ]);
      setTitle(""); setFileUrl(""); setDescription(""); setType("design");
      toast.success("Published for review", "The client can now approve or request changes.");
      router.refresh();
    } catch {
      toast.error("Could not publish", "Unexpected error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-5 w-5 text-brand-deep" />
        <h3 className="text-sm font-bold text-slate-900">Client Deliverables</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5">Publish work to the client portal for approval.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deliverable title"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none"
        >
          <option value="design">Design</option>
          <option value="document">Document</option>
          <option value="video">Video</option>
          <option value="website">Website / Link</option>
          <option value="general">Other</option>
        </select>
        <input
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="File / preview URL (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none sm:col-span-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes for the client (optional)"
          rows={2}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none sm:col-span-2"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-deep px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Publishing…" : "Publish for review"}
      </button>

      {items.length > 0 && (
        <div className="mt-6 space-y-2">
          {items.map((d) => {
            const badge = STATUS_BADGE[d.status || "pending_review"] || STATUS_BADGE.pending_review;
            const Icon = badge.Icon;
            return (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{d.title}</p>
                  {d.client_feedback && (
                    <p className="text-xs text-rose-600 truncate">Feedback: {d.client_feedback}</p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                  <Icon className="h-3 w-3" /> {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
