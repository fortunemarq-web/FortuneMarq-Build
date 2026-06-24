"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

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
      aria-label="Switch language"
      className="lp-lang"
    >
      <Globe className="lp-lang-icon" />
      <span>{label}</span>
    </Link>
  );
}
