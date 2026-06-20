import { Star } from "lucide-react";

// Health maps to the five tones: low = danger, mid = warning, high = brand (success).
const COLORS = [
  "",           // 0 (unused)
  "text-danger", // 1
  "text-danger", // 2
  "text-warn",   // 3
  "text-brand",  // 4
  "text-brand",  // 5
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
