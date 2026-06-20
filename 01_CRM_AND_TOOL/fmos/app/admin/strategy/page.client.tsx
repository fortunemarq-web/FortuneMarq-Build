"use client";

import { useState } from "react";
import StrategyPastePanel from "@/components/admin/strategy/StrategyPastePanel";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div>
          <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back to Command Hub
          </Link>

          <PageHeader
            eyebrow="Strategy"
            title="Strategy Engine"
            subtitle="Paste a strategy file to automatically generate tasks"
            actions={
              <Link href="/admin/strategy/archive" className={buttonVariants({ variant: "secondary" })}>
                Strategy Archive
              </Link>
            }
          />
        </div>

        {/* Step 1: Configuration */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-brand-deep">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-[15px] font-semibold text-slate-900">Step 1: Configure Destination</h2>
              <p className="mt-0.5 text-xs text-slate-500">Where should these tasks live?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <Label>Destination Section</Label>
              <Select value={destination} onChange={(e) => setDestination(e.target.value)}>
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
              </Select>
            </div>

            <div>
              <Label>Timeframe</Label>
              <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="7_days">7 Days</option>
                <option value="14_days">14 Days</option>
                <option value="30_days">30 Days</option>
                <option value="60_days">60 Days</option>
                <option value="90_days">90 Days</option>
                <option value="custom">Custom</option>
              </Select>
            </div>

            <div>
              <Label>Default Assignee</Label>
              <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name} ({member.role})</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Step 2: Paste and Render (AI runs server-side; no API key in the browser) */}
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
