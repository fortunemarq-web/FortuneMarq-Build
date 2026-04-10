"use client";

import { useState, useTransition } from "react";
import { logClientCall } from "@/app/admin/clients/actions";
import {
  Phone,
  Plus,
  X,
  Loader2,
  MessageSquare,
  Clock,
} from "lucide-react";

interface CallLog {
  id: string;
  call_date: string;
  duration_minutes: number | null;
  outcome: string | null;
  notes: string | null;
  created_at: string | null;
  profiles?: { full_name: string | null } | null;
}

interface WhatsAppLog {
  id: string;
  message_body: string | null;
  sent_at: string | null;
  template_name?: string | null;
}

export default function CommunicationsTab({
  callLogs: initialCallLogs,
  whatsappLogs,
  clientId,
}: {
  callLogs: CallLog[];
  whatsappLogs: WhatsAppLog[];
  clientId: string;
}) {
  const [callLogs, setCallLogs] = useState(initialCallLogs);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const outcomeLabel = (o: string | null) => {
    const map: Record<string, { label: string; color: string }> = {
      productive: { label: "Productive", color: "bg-emerald-50 text-emerald-700" },
      no_answer: { label: "No Answer", color: "bg-slate-100 text-slate-600" },
      rescheduled: { label: "Rescheduled", color: "bg-blue-50 text-blue-700" },
      complaint: { label: "Complaint", color: "bg-red-50 text-red-700" },
      feedback: { label: "Feedback", color: "bg-amber-50 text-amber-700" },
    };
    return map[o ?? ""] ?? { label: o ?? "—", color: "bg-slate-50 text-slate-600" };
  };

  const handleLogCall = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await logClientCall({
        client_id: clientId,
        call_date: fd.get("call_date") as string,
        duration_minutes: parseInt(fd.get("duration") as string) || 0,
        outcome: fd.get("outcome") as string,
        notes: fd.get("notes") as string,
      });

      if (result.success) {
        setShowModal(false);
        // Add to local state optimistically
        setCallLogs((prev) => [
          {
            id: crypto.randomUUID(),
            call_date: fd.get("call_date") as string,
            duration_minutes: parseInt(fd.get("duration") as string) || 0,
            outcome: fd.get("outcome") as string,
            notes: fd.get("notes") as string,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Call Logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Call Logs
            </h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 transition-all min-h-[36px]"
          >
            <Plus className="h-3 w-3" />
            Log Call
          </button>
        </div>

        {callLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-sm text-slate-400">No calls logged yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {callLogs.map((log) => {
              const oc = outcomeLabel(log.outcome);
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${oc.color}`}>
                      {oc.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.call_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.duration_minutes ?? 0} min
                    </div>
                  </div>
                  {log.notes && (
                    <p className="mt-2 text-xs text-slate-600">{log.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Messages */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            WhatsApp Messages
          </h3>
        </div>

        {whatsappLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-sm text-slate-400">
              No WhatsApp messages found for this client
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Messages sent via the Sales Cockpit will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {whatsappLogs.map((msg) => (
              <div
                key={msg.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
              >
                {msg.template_name && (
                  <span className="inline-block rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 mb-1">
                    {msg.template_name}
                  </span>
                )}
                <p className="text-xs text-slate-600">{msg.message_body}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(msg.sent_at || "").toLocaleDateString("en-IN", {
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

      {/* Log Call Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">Log Call</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogCall} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="call_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    name="duration"
                    type="number"
                    min="0"
                    defaultValue="5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:border-[#42CA80] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  name="outcome"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none min-h-[40px]"
                >
                  <option value="productive">Productive</option>
                  <option value="no_answer">No Answer</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="complaint">Complaint</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none resize-none"
                  placeholder="Call summary..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-[#42CA80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b571] disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Call"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
