"use client";

import { useState } from "react";
import { Bot, FileText, ArrowRight, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StrategyPastePanel({ 
  destination, 
  timeframe, 
  assignee 
}: { 
  destination: string, 
  timeframe: string, 
  assignee: string 
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleGenerate = async () => {
    if (!text) return;
    
    const key = sessionStorage.getItem("ANTHROPIC_API_KEY");
    const model = sessionStorage.getItem("ANTHROPIC_MODEL") || "claude-sonnet-4-20250514";
    
    if (!key) {
      setError("Please save your Anthropic API Key in Step 2 before generating.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const systemPrompt = `You are a task extraction engine for FortuneMarq, a digital marketing agency.

You will receive a strategy document. Your job is to extract ALL actionable tasks and return them as a JSON array.

DESTINATION CONTEXT: ${destination}
TIMEFRAME: ${timeframe}
DEFAULT ASSIGNEE: ${assignee}
TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

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
      "section_tag": "string (matches destination, e.g. 'instagram', 'acquisition_hubli_dental')",
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

      sessionStorage.setItem("STRATEGY_REVIEW_DATA", JSON.stringify({
        sourceText: text,
        destination,
        timeframe,
        generated: parsedTasks
      }));

      router.push("/admin/strategy/review");

    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to process strategy: ${message}. Check your API key and ensure the document format is valid.`);
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-100">
          <div className="h-full bg-indigo-500 animate-[pulse_2s_infinite] w-1/3 rounded-r-full" />
        </div>
        
        <Bot className="h-16 w-16 text-indigo-500 mx-auto mb-6 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Reading your strategy...</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Claude is analyzing the document, identifying actionable items, and structuring them into tasks. This takes about 5-15 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 3: Paste Strategy File</h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Paste the raw markdown from Claude.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <XCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#42CA80] focus-within:ring-1 focus-within:ring-[#42CA80] transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`---
STRATEGY_TYPE: instagram_organic
DESTINATION: agency_growth.instagram
...
# Objectives
- Reach 500 followers by end of April

## Week 1 Tasks
- [TASK] Create brand intro reel | DUE: March 15 | PRIORITY: high
`}
          className="w-full h-[400px] p-4 text-sm font-mono text-slate-700 bg-slate-50/50 resize-y focus:outline-none focus:bg-white"
        />
        
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>{charCount.toLocaleString()} chars</span>
            <div className="w-px h-3 bg-slate-300" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setText("")}
              disabled={!text}
              className="text-xs font-semibold text-slate-500 hover:text-red-500 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={!text || wordCount < 10}
              className="flex items-center gap-2 bg-[#42CA80] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#38b571] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate Tasks <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
