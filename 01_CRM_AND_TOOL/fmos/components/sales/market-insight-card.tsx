import type { Database } from "@/types/database.types";
import { Card } from "@/components/ui/card";

type MarketInsight = Database["public"]["Tables"]["market_insights"]["Row"];

interface MarketInsightCardProps {
  industry: string;
  city: string;
  data?: MarketInsight | null;
}

export default function MarketInsightCard({
  industry,
  city,
  data,
}: MarketInsightCardProps) {
  return (
    <Card className="w-full border-l-4 border-l-brand p-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Industry</p>
          <p className="text-base font-semibold text-slate-900">{industry}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">City</p>
          <p className="text-base font-semibold text-slate-900">{city}</p>
        </div>

        {data ? (
          <>
            {data.search_volume && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Search Volume</p>
                <p className="text-base text-slate-900">{data.search_volume}</p>
              </div>
            )}

            {data.market_difficulty && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Competition</p>
                <p className="text-base text-slate-900">{data.market_difficulty}</p>
              </div>
            )}

            {data.pitch_angle && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Pitch Tip</p>
                <p className="text-base text-slate-900">{data.pitch_angle}</p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">
              No market data available for this segment yet.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
