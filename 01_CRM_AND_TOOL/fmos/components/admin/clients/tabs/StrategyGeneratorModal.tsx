"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Bot, XCircle } from "lucide-react";
import { extractStrategyTasks } from "@/app/admin/strategy/actions";

interface ClientData {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  services: string[];
}

export default function StrategyGeneratorModal({
  isOpen,
  onClose,
  client,
  team,
  strategyId,
  strategyLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData;
  team: any[];
  strategyId: string;
  strategyLabel: string;
}) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("30_days");
  const [assignee, setAssignee] = useState(team[0]?.id || "admin");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text) {
      setError("Strategy Document is required.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Key never touches the browser — extraction runs in a server action.
      const result = await extractStrategyTasks({
        text,
        destination: strategyId,
        timeframe,
        assignee,
        client: {
          business_name: client.business_name,
          niche: client.niche,
          city: client.city,
          services: client.services,
        },
        strategyLabel,
      });

      if (!result.success) throw new Error(result.error);

      const parsedTasks = result.data;
      const mappedTasks = (parsedTasks.tasks || []).map((t: any) => ({
        ...t,
        client_id: client.id,
      }));

      sessionStorage.setItem(
        "STRATEGY_REVIEW_DATA",
        JSON.stringify({
          sourceText: text,
          destination: strategyId,
          timeframe,
          client_id: client.id,
          strategy_type: strategyLabel,
          generated: { ...parsedTasks, tasks: mappedTasks },
        })
      );

      router.push("/admin/strategy/review");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to process strategy: ${message}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Generate Client Strategy</h2>
              <p className="text-sm text-slate-500">Creating tasks for {client.business_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <XCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isProcessing ? (
            <div className="py-12 text-center">
              <Bot className="h-16 w-16 text-indigo-500 mx-auto mb-6 animate-bounce" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reading strategy for {client.business_name}...</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Claude is analyzing the document against {strategyLabel} best practices and assigning tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Context pre-fills */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Client</label>
                  <input type="text" disabled value={client.business_name} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Strategy Type</label>
                  <input type="text" disabled value={strategyLabel} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-medium" />
                </div>
              </div>

              {/* Engine Config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="30_days">30 Days</option>
                    <option value="60_days">60 Days</option>
                    <option value="90_days">90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Default Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  >
                    {team.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Strategy Document</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste strategy markdown from Claude here..."
                  className="w-full h-48 bg-slate-50/50 border border-slate-200 rounded-lg text-sm p-4 font-mono focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none transition-colors"
                />
              </div>

            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-6 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !text || text.length < 10}
            className="flex items-center gap-2 rounded-lg bg-[#42CA80] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#38b571] disabled:opacity-50 transition-colors"
          >
            {isProcessing ? "Generating..." : "Generate Tasks →"}
          </button>
        </div>
      </div>
    </div>
  );
}
