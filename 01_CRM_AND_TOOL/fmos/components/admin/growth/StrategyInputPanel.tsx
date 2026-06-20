"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StrategyInputPanelProps {
  destination?: string;
  defaultTimeframe?: string;
}

export default function StrategyInputPanel({ 
  destination = "agency_growth.instagram",
  defaultTimeframe = "30_days"
}: StrategyInputPanelProps) {
  const router = useRouter();

  return (
    <Card className="mt-8 overflow-hidden">
      <div className="px-5 py-4 border-b border-line bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-deep" />
          <h3 className="font-display text-[15px] font-semibold text-slate-900">Strategy-to-Task Engine</h3>
        </div>
      </div>

      <div className="p-6 relative">
        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-4">
            Have a strategy ready? Our AI Engine can automatically break down any text document into actionable tasks and route them here.
          </p>
          <Button
            onClick={() => router.push(`/admin/strategy?destination=${destination}&timeframe=${defaultTimeframe}`)}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Sparkles className="h-4 w-4" /> Go to Strategy Engine <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
