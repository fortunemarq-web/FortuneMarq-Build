"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markClientRenewed,
  markClientChurned,
  logUpsellAttempt,
} from "@/app/admin/clients/renewals/actions";
import { CalendarClock, Check, X, Loader2, TrendingUp } from "lucide-react";
import ServicePills from "@/components/admin/clients/ServicePills";
import HealthScoreStars from "@/components/admin/clients/HealthScoreStars";

interface ClientForRenewal {
  id: string;
  business_name: string;
  niche: string | null;
  services: string[] | null;
  monthly_value: number;
  renewal_date: string | null;
  health_score: number;
  status: string;
  start_date: string | null;
  last_upsell_attempt: string | null;
}

const ALL_SERVICES = [
  "website",
  "seo",
  "local_seo",
  "meta_ads",
  "google_ads",
  "smm",
  "whatsapp",
];

export function RenewalTable({
  clients: initialClients,
}: {
  clients: ClientForRenewal[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const renewalColor = (days: number) => {
    if (days <= 14) return "text-red-600 bg-red-50";
    if (days <= 30) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const handleRenew = (clientId: string) => {
    const newDate = prompt(
      "Enter new renewal date (YYYY-MM-DD):",
      new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
    );
    if (!newDate) return;

    setPendingId(clientId);
    startTransition(async () => {
      await markClientRenewed(clientId, newDate);
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId ? { ...c, renewal_date: newDate } : c
        )
      );
      setPendingId(null);
    });
  };

  const handleChurn = (clientId: string) => {
    if (!confirm("Mark this client as churned?")) return;
    setPendingId(clientId);
    startTransition(async () => {
      await markClientChurned(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setPendingId(null);
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[750px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Client
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Niche
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Services
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              MRR
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Renewal
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Days Left
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                No upcoming renewals in the next 60 days 🎉
              </td>
            </tr>
          ) : (
            clients.map((c) => {
              const days = c.renewal_date
                ? Math.floor(
                    (new Date(c.renewal_date).getTime() - Date.now()) / 86400000
                  )
                : 999;
              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-[#42CA80] transition-colors"
                    >
                      {c.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.niche ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ServicePills services={c.services} max={3} />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-800">
                    ₹{(c.monthly_value ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.renewal_date
                      ? new Date(c.renewal_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${renewalColor(
                        days
                      )}`}
                    >
                      {days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRenew(c.id)}
                        disabled={pendingId === c.id}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition-colors min-h-[36px]"
                        title="Mark Renewed"
                      >
                        {pendingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleChurn(c.id)}
                        disabled={pendingId === c.id}
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors min-h-[36px]"
                        title="Mark Churned"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function UpsellTable({
  clients: initialClients,
}: {
  clients: ClientForRenewal[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleLogUpsell = (clientId: string) => {
    const notes = prompt("Upsell notes (service pitched, outcome, follow-up):");
    if (!notes) return;

    setPendingId(clientId);
    startTransition(async () => {
      await logUpsellAttempt(clientId, notes);
      setPendingId(null);
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Client
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Current Services
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Missing Services
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Health
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Last Attempt
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {initialClients.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                No upsell opportunities detected
              </td>
            </tr>
          ) : (
            initialClients.map((c) => {
              const currentServices = c.services ?? [];
              const missing = ALL_SERVICES.filter(
                (s) => !currentServices.includes(s)
              );
              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-[#42CA80] transition-colors"
                    >
                      {c.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ServicePills services={currentServices} max={3} />
                  </td>
                  <td className="px-4 py-3">
                    <ServicePills services={missing} max={3} />
                  </td>
                  <td className="px-4 py-3">
                    <HealthScoreStars score={c.health_score} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.last_upsell_attempt
                      ? new Date(c.last_upsell_attempt).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short" }
                        )
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleLogUpsell(c.id)}
                      disabled={pendingId === c.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#42CA80] hover:text-[#42CA80] transition-all min-h-[36px]"
                    >
                      {pendingId === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      Log Attempt
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
