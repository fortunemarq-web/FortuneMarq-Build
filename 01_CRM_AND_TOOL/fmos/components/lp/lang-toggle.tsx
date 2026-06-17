"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";

/** Toggle EN ↔ KN by flipping the ?lang query param. */
export default function LangToggle({ lang, label }: { lang: "en" | "kn"; label: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const next = new URLSearchParams(params.toString());
  if (lang === "en") next.set("lang", "kn");
  else next.delete("lang");
  const href = `${pathname}${next.toString() ? `?${next.toString()}` : ""}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-brand/40 hover:text-white"
    >
      <Languages className="h-3.5 w-3.5 text-brand" />
      {label}
    </Link>
  );
}
