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
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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

  const outcomeLabel = (o: string | null): { label: string; tone: Tone } => {
    const map: Record<string, { label: string; tone: Tone }> = {
      productive: { label: "Productive", tone: "brand" },
      no_answer: { label: "No Answer", tone: "neutral" },
      rescheduled: { label: "Rescheduled", tone: "info" },
      complaint: { label: "Complaint", tone: "danger" },
      feedback: { label: "Feedback", tone: "warning" },
    };
    return map[o ?? ""] ?? { label: o ?? "—", tone: "neutral" };
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
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-slate-500">
              Call Logs
            </h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[36px]"
          >
            <Plus className="h-3 w-3" />
            Log Call
          </button>
        </div>

        {callLogs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-400">No calls logged yet</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {callLogs.map((log) => {
              const oc = outcomeLabel(log.outcome);
              return (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone={oc.tone} size="sm" className="uppercase">
                      {oc.label}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
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
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Messages */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-slate-500">
            WhatsApp Messages
          </h3>
        </div>

        {whatsappLogs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-400">
              No WhatsApp messages found for this client
            </p>
            <p className="text-xs text-slate-700 mt-1">
              Messages sent via the Sales Cockpit will appear here
            </p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {whatsappLogs.map((msg) => (
              <Card key={msg.id} className="p-4">
                {msg.template_name && (
                  <Badge tone="brand" size="sm" className="mb-1">
                    {msg.template_name}
                  </Badge>
                )}
                <p className="text-xs text-slate-600">{msg.message_body}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date(msg.sent_at || "").toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Call Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="font-display text-sm font-semibold text-slate-900">Log Call</h3>
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
                    Date <span className="text-danger">*</span>
                  </label>
                  <Input
                    name="call_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (min)
                  </label>
                  <Input
                    name="duration"
                    type="number"
                    min="0"
                    defaultValue="5"
                    className="h-10 tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outcome <span className="text-danger">*</span>
                </label>
                <Select name="outcome" required className="h-10">
                  <option value="productive">Productive</option>
                  <option value="no_answer">No Answer</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="complaint">Complaint</option>
                  <option value="feedback">Feedback</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <Textarea
                  name="notes"
                  rows={3}
                  className="resize-none"
                  placeholder="Call summary..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-brand-deep px-4 py-3 text-sm font-semibold text-white hover:bg-brand-deeper disabled:opacity-50 transition-colors min-h-[44px]"
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
                  className="rounded-lg border border-line-strong px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
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
