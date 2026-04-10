"use client";

import { useState } from "react";
import LLMKeyManager from "@/components/admin/strategy/LLMKeyManager";
import StrategyPastePanel from "@/components/admin/strategy/StrategyPastePanel";
import { ArrowLeft, Brain, Cpu, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function StrategyEngineClient({
  team,
  organicDestinations,
  acquisitionDestinations
}: {
  team: any[];
  organicDestinations: { id: string, label: string }[];
  acquisitionDestinations: { id: string, label: string }[];
}) {
  const searchParams = useSearchParams();
  const defaultDest = searchParams.get("destination");

  const [destination, setDestination] = useState(defaultDest || "agency_growth.instagram");
  const [timeframe, setTimeframe] = useState("30_days");
  const [assignee, setAssignee] = useState(team.length > 0 ? team[0].id : "admin");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Command Hub
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 border border-indigo-400">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Strategy Engine</h1>
                <p className="text-sm text-slate-500 mt-1">Paste a strategy file to automatically generate tasks</p>
              </div>
            </div>

            <Link href="/admin/strategy/archive" className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
              Strategy Archive
            </Link>
          </div>
        </div>

        {/* Step 1: Configuration */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 1: Configure Destination</h2>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Where should these tasks live?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Destination Section</label>
              <select 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <optgroup label="Organic Growth">
                  {organicDestinations.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Client Acquisition">
                  {acquisitionDestinations.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Timeframe</label>
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="7_days">7 Days</option>
                <option value="14_days">14 Days</option>
                <option value="30_days">30 Days</option>
                <option value="60_days">60 Days</option>
                <option value="90_days">90 Days</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Default Assignee</label>
              <select 
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name} ({member.role})</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Step 2: LLM Config Key storage */}
        <section>
          <LLMKeyManager />
        </section>

        {/* Step 3: Paste and Render */}
        <section>
          <StrategyPastePanel 
            destination={destination}
            timeframe={timeframe}
            assignee={assignee}
          />
        </section>

      </div>
    </div>
  );
}
