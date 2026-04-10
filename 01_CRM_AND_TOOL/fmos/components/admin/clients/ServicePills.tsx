const SERVICE_CONFIG: Record<string, { label: string; color: string }> = {
  website: { label: "Website", color: "bg-blue-50 text-blue-700 border-blue-200" },
  seo: { label: "SEO", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  meta_ads: { label: "Meta Ads", color: "bg-purple-50 text-purple-700 border-purple-200" },
  google_ads: { label: "Google Ads", color: "bg-amber-50 text-amber-700 border-amber-200" },
  smm: { label: "SMM", color: "bg-pink-50 text-pink-700 border-pink-200" },
  whatsapp: { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-200" },
  web_dev: { label: "Web Dev", color: "bg-blue-50 text-blue-700 border-blue-200" },
  local_seo: { label: "Local SEO", color: "bg-teal-50 text-teal-700 border-teal-200" },
  performance_marketing: { label: "Perf. Mkt", color: "bg-orange-50 text-orange-700 border-orange-200" },
  social_media: { label: "Social", color: "bg-pink-50 text-pink-700 border-pink-200" },
  whatsapp_marketing: { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-200" },
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
