"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markClientRenewed,
  markClientChurned,
  logUpsellAttempt,
} from "@/app/admin/clients/renewals/actions";
import { CalendarClock, Check, X, Loader2, TrendingUp, MessageCircle } from "lucide-react";
import ServicePills from "@/components/admin/clients/ServicePills";
import { promptModal } from "@/components/ui/prompt-modal";
import HealthScoreStars from "@/components/admin/clients/HealthScoreStars";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

interface ClientForRenewal {
  id: string;
  business_name: string;
  niche: string | null;
  services: string[] | null;
  services_active?: string[] | null;
  monthly_value: number;
  renewal_date: string | null;
  health_score: number;
  status: string;
  start_date: string | null;
  last_upsell_attempt: string | null;
  phone?: string | null;
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
    if (days <= 14) return "text-danger bg-danger-soft";
    if (days <= 30) return "text-warn bg-warn-soft";
    return "text-brand-deep bg-brand-soft";
  };

  const handleRenew = async (clientId: string) => {
    const newDate = await promptModal({
      title: "Renew client",
      description: "Pick the new renewal date for this client.",
      type: "date",
      defaultValue: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      confirmLabel: "Renew",
    });
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

  const handleChurn = async (clientId: string) => {
    const ok = await promptModal({ title: "Mark client as churned?", description: "This will move them to churned status and remove from active renewals.", confirmLabel: "Mark Churned", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, mark as churned" }] });
    if (!ok) return;
    setPendingId(clientId);
    startTransition(async () => {
      await markClientChurned(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setPendingId(null);
    });
  };

  return (
    <Card className="overflow-x-auto">
      <Table className="min-w-[750px]">
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Client</TH>
            <TH>Niche</TH>
            <TH>Services</TH>
            <TH>MRR</TH>
            <TH>Renewal</TH>
            <TH>Days Left</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {clients.length === 0 ? (
            <TR className="hover:bg-transparent">
              <TD colSpan={7} className="py-12 text-center text-sm text-slate-400">
                No upcoming renewals in the next 60 days
              </TD>
            </TR>
          ) : (
            clients.map((c) => {
              const days = c.renewal_date
                ? Math.floor(
                    (new Date(c.renewal_date).getTime() - Date.now()) / 86400000
                  )
                : 999;
              return (
                <TR key={c.id}>
                  <TD>
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-brand-deep transition-colors"
                    >
                      {c.business_name}
                    </Link>
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {c.niche ?? "—"}
                  </TD>
                  <TD>
                    <ServicePills services={c.services_active ?? c.services} max={3} />
                  </TD>
                  <TD className="text-sm font-semibold tabular-nums text-slate-800">
                    ₹{(c.monthly_value ?? 0).toLocaleString("en-IN")}
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {c.renewal_date
                      ? new Date(c.renewal_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </TD>
                  <TD>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${renewalColor(
                        days
                      )}`}
                    >
                      {days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.phone && (
                        <a
                          href={`https://wa.me/91${String(c.phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi! Jabeer from FortuneMarq here. Your plan with us comes up for renewal${c.renewal_date ? ` on ${new Date(c.renewal_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}` : " soon"} — I'd love to walk you through what we achieved this cycle and the plan for the next one. When's a good time for a quick call?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-brand-line bg-brand-soft p-2 text-brand-deep hover:bg-brand-100 transition-colors min-h-[36px]"
                          title="Start renewal conversation on WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleRenew(c.id)}
                        disabled={pendingId === c.id}
                        className="rounded-lg border border-brand-line bg-brand-soft p-2 text-brand-deep hover:bg-brand-100 transition-colors min-h-[36px]"
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
                        className="rounded-lg border border-danger-line bg-danger-soft p-2 text-danger hover:bg-red-100 transition-colors min-h-[36px]"
                        title="Mark Churned"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </Card>
  );
}

export function UpsellTable({
  clients: initialClients,
}: {
  clients: ClientForRenewal[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleLogUpsell = async (clientId: string) => {
    const notes = await promptModal({
      title: "Log upsell attempt",
      description: "What was pitched, the outcome, and any follow-up.",
      type: "textarea",
      placeholder: "Service pitched, outcome, follow-up…",
      confirmLabel: "Log",
    });
    if (!notes) return;

    setPendingId(clientId);
    startTransition(async () => {
      await logUpsellAttempt(clientId, notes);
      setPendingId(null);
    });
  };

  return (
    <Card className="overflow-x-auto">
      <Table className="min-w-[700px]">
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Client</TH>
            <TH>Current Services</TH>
            <TH>Missing Services</TH>
            <TH>Health</TH>
            <TH>Last Attempt</TH>
            <TH className="text-right">Action</TH>
          </TR>
        </THead>
        <TBody>
          {initialClients.length === 0 ? (
            <TR className="hover:bg-transparent">
              <TD colSpan={6} className="py-12 text-center text-sm text-slate-400">
                No upsell opportunities detected
              </TD>
            </TR>
          ) : (
            initialClients.map((c) => {
              const currentServices = c.services ?? [];
              const missing = ALL_SERVICES.filter(
                (s) => !currentServices.includes(s)
              );
              return (
                <TR key={c.id}>
                  <TD>
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-brand-deep transition-colors"
                    >
                      {c.business_name}
                    </Link>
                  </TD>
                  <TD>
                    <ServicePills services={c.services_active ?? currentServices} max={3} />
                  </TD>
                  <TD>
                    <ServicePills services={missing} max={3} />
                  </TD>
                  <TD>
                    <HealthScoreStars score={c.health_score} />
                  </TD>
                  <TD className="text-xs text-slate-500">
                    {c.last_upsell_attempt
                      ? new Date(c.last_upsell_attempt).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short" }
                        )
                      : "Never"}
                  </TD>
                  <TD className="text-right">
                    <button
                      onClick={() => handleLogUpsell(c.id)}
                      disabled={pendingId === c.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand-deep transition-colors min-h-[36px]"
                    >
                      {pendingId === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      Log Attempt
                    </button>
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </Card>
  );
}
