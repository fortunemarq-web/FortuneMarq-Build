import { Star } from "lucide-react";

const COLORS = [
  "", // 0 (unused)
  "text-red-500",     // 1
  "text-red-400",     // 2
  "text-amber-500",   // 3
  "text-emerald-500", // 4
  "text-emerald-600", // 5
];

export default function HealthScoreStars({
  score,
  size = "sm",
}: {
  score: number | null;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(1, Math.min(5, score || 3));
  const iconSize = size === "md" ? "h-4 w-4" : "h-3 w-3";

  return (
    <div className="flex items-center gap-0.5" title={`Health: ${clamped}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i <= clamped ? COLORS[clamped] : "text-slate-200"
          } ${i <= clamped ? "fill-current" : ""}`}
        />
      ))}
    </div>
  );
}
