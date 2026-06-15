"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Key, FileText, Bot, XCircle } from "lucide-react";
import { ANTHROPIC_MODELS } from "@/lib/ai-models";

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
  const [key, setKey] = useState("");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const sessionKey = sessionStorage.getItem("ANTHROPIC_API_KEY");
      if (sessionKey) setKey(sessionKey);
    }
  }, [isOpen]);

  const handleKeySave = (newKey: string) => {
    setKey(newKey);
    sessionStorage.setItem("ANTHROPIC_API_KEY", newKey);
  };

  const handleGenerate = async () => {
    if (!text || !key) {
      setError("API Key and Strategy Document are required.");
      return;
    }

    const model = sessionStorage.getItem("ANTHROPIC_MODEL") || ANTHROPIC_MODELS.smart;
    setIsProcessing(true);
    setError(null);

    try {
      const systemPrompt = `You are a task extraction engine for FortuneMarq, a digital marketing agency.

You will receive a strategy document. Your job is to extract ALL actionable tasks and return them as a JSON array.

DESTINATION CONTEXT: ${strategyLabel} (${strategyId})
TIMEFRAME: ${timeframe}
DEFAULT ASSIGNEE: ${assignee}
TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

CLIENT CONTEXT:
- Client Name: ${client.business_name}
- Niche: ${client.niche || "N/A"}
- City: ${client.city || "N/A"}
- Active Services: ${client.services?.join(", ") || "N/A"}
- Strategy Type: ${strategyLabel}

Rules:
1. Extract EVERY specific action item from the document
2. If a task has no explicit due date, distribute tasks evenly across the timeframe
3. If a task has no assignee, use the default assignee
4. Break large vague tasks into smaller specific ones (max 2 hours of work per task)
5. Priority: use 'high' for week 1 items, 'medium' for week 2-3, 'low' for later
6. Every task MUST have: title, description, due_date (YYYY-MM-DD), priority, assignee, section_tag

Return ONLY valid JSON, no preamble, no explanation. Format:
{
  "strategy_title": "string",
  "total_tasks": number,
  "tasks": [
    {
      "title": "string (max 80 chars, action verb first)",
      "description": "string (1-2 sentences of context/guidance)",
      "due_date": "YYYY-MM-DD",
      "priority": "high|medium|low",
      "assignee": "admin|telecaller|user_id",
      "section_tag": "${strategyId}",
      "estimated_minutes": number
    }
  ]
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          temperature: 0,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Here is the strategy document. Please extract the tasks into the requested JSON format:\n\n${text}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.content?.[0]?.text || "{}";
      const cleanedText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedTasks = JSON.parse(cleanedText);

      const mappedTasks = parsedTasks.tasks.map((t: any) => ({
        ...t,
        client_id: client.id,
      }));

      sessionStorage.setItem("STRATEGY_REVIEW_DATA", JSON.stringify({
        sourceText: text,
        destination: strategyId,
        timeframe,
        client_id: client.id,
        strategy_type: strategyLabel,
        generated: { ...parsedTasks, tasks: mappedTasks }
      }));

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

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Anthropic API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="password"
                    value={key}
                    onChange={(e) => handleKeySave(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-400 focus:outline-none"
                  />
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
