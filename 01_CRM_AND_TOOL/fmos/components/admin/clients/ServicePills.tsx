// Services are labels, not statuses — one neutral tone (no per-service rainbow),
// per the single-green-accent design system.
const PILL = "bg-slate-50 text-slate-600 border-slate-200";
const SERVICE_CONFIG: Record<string, { label: string; color: string }> = {
  website: { label: "Website", color: PILL },
  seo: { label: "SEO", color: PILL },
  meta_ads: { label: "Meta Ads", color: PILL },
  google_ads: { label: "Google Ads", color: PILL },
  smm: { label: "SMM", color: PILL },
  whatsapp: { label: "WhatsApp", color: PILL },
  web_dev: { label: "Web Dev", color: PILL },
  local_seo: { label: "Local SEO", color: PILL },
  performance_marketing: { label: "Perf. Mkt", color: PILL },
  social_media: { label: "Social", color: PILL },
  whatsapp_marketing: { label: "WhatsApp", color: PILL },
};

export default function ServicePills({
  services,
  max = 4,
}: {
  services: string[] | null;
  max?: number;
}) {
  if (!services || services.length === 0) {
    return <span className="text-xs text-slate-300 italic">No services</span>;
  }

  const visible = services.slice(0, max);
  const remaining = services.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((s) => {
        const cfg = SERVICE_CONFIG[s] ?? {
          label: s.replace(/_/g, " "),
          color: "bg-slate-50 text-slate-600 border-slate-200",
        };
        return (
          <span
            key={s}
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${cfg.color}`}
          >
            {cfg.label}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}
