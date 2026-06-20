import type { ElementType } from "react";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { FileSignature, CheckCircle, Clock, XCircle } from "lucide-react";
import AgreementRowActions from "@/components/proposals/agreement-row-actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

// agreements.status CHECK allows only pending / confirmed / cancelled.
// Every status maps to one of the five tones — no per-status colours.
const STATUS_CONFIG: Record<string, { label: string; tone: Tone; icon: ElementType }> = {
  pending:   { label: "Pending",   tone: "warning", icon: Clock },
  confirmed: { label: "Confirmed", tone: "brand",   icon: CheckCircle },
  cancelled: { label: "Cancelled", tone: "danger",  icon: XCircle },
};

export default async function AgreementsPage() {
  const supabase = await createServerClientWithCookies();

  const { data: agreements, error } = await supabase
    .from("agreements")
    .select(`
      id,
      agreement_number,
      proposal_ref,
      status,
      total_setup,
      total_monthly,
      start_date,
      created_at,
      confirmed_at,
      services,
      lead:leads(id, company_name, city, industry),
      proposal:proposals(id, proposal_number)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-red-500">Error loading agreements: {error.message}</p>
      </div>
    );
  }

  // Resolve clients by business_name so "Client ↗" can deep-link to the right client.
  const { data: clientRows } = await supabase.from("clients").select("id, business_name");
  const clientByName = new Map(
    (clientRows || []).map((c: any) => [String(c.business_name || "").trim().toLowerCase(), c.id])
  );
  const clientHref = (companyName: string | null | undefined) => {
    const id = clientByName.get(String(companyName || "").trim().toLowerCase());
    return id ? `/admin/clients/${id}` : "/admin/clients";
  };

  const formatINR = (n: number | null) => (n ? `₹${n.toLocaleString("en-IN")}` : "—");
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const total = (agreements || []).length;
  const confirmed = (agreements || []).filter((a: any) => a.status === "confirmed").length;
  const pending = (agreements || []).filter((a: any) => a.status === "pending").length;
  const totalMRR = (agreements || [])
    .filter((a: any) => a.status === "confirmed")
    .reduce((s: number, a: any) => s + (a.total_monthly || 0), 0);

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <PageHeader title="Agreements" subtitle={`${total} total`} />

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={total} />
          <StatCard label="Confirmed" value={confirmed} />
          <StatCard label="Pending" value={pending} />
          <StatCard label="Confirmed MRR" value={formatINR(totalMRR) + "/mo"} />
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {!agreements || agreements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileSignature className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No agreements yet.</p>
              <p className="mt-1 text-xs">Generate one from a lead's proposal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    {["Agreement No", "Lead / Client", "Services", "Setup", "Monthly", "Status", "Start Date", "Actions"].map((h) => (
                      <TH key={h} className="whitespace-nowrap">{h}</TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {(agreements as any[]).map((a) => {
                    const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                    const StatusIcon = sc.icon;
                    const services = Array.isArray(a.services)
                      ? a.services.map((s: any) => s.label || s.id).join(", ")
                      : "—";

                    return (
                      <TR key={a.id}>
                        {/* Agreement number */}
                        <TD>
                          <span className="text-xs font-semibold tabular-nums text-slate-700">
                            {a.agreement_number || "—"}
                          </span>
                          {a.proposal_ref && (
                            <p className="text-[11px] text-slate-400">Ref: {a.proposal_ref}</p>
                          )}
                        </TD>

                        {/* Lead */}
                        <TD>
                          {a.lead ? (
                            <Link
                              href={`/admin/leads/${a.lead.id}`}
                              className="font-semibold text-slate-900 transition-colors hover:text-brand-deep"
                            >
                              {a.lead.company_name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {a.lead?.city && (
                            <p className="text-[11px] text-slate-400">{a.lead.city}</p>
                          )}
                        </TD>

                        {/* Services */}
                        <TD className="max-w-[160px]">
                          <p className="truncate text-xs text-slate-600" title={services}>{services}</p>
                        </TD>

                        {/* Setup */}
                        <TD className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-800">
                          {formatINR(a.total_setup)}
                        </TD>

                        {/* Monthly */}
                        <TD className="whitespace-nowrap text-sm font-semibold tabular-nums text-brand-deep">
                          {formatINR(a.total_monthly)}/mo
                        </TD>

                        {/* Status */}
                        <TD>
                          <Badge tone={sc.tone} size="sm">
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                          {a.confirmed_at && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {formatDate(a.confirmed_at)}
                            </p>
                          )}
                        </TD>

                        {/* Start date */}
                        <TD className="whitespace-nowrap text-xs text-slate-500">
                          {formatDate(a.start_date)}
                        </TD>

                        {/* Actions */}
                        <TD>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/agreements/${a.id}`}
                              className="whitespace-nowrap text-[11px] font-semibold text-brand-deep hover:underline"
                            >
                              View →
                            </Link>
                            {a.status === "confirmed" && a.lead && (
                              <Link
                                href={clientHref(a.lead?.company_name)}
                                className="whitespace-nowrap text-[11px] font-semibold text-brand-deep hover:underline"
                              >
                                Client ↗
                              </Link>
                            )}
                            <AgreementRowActions
                              agreementId={a.id}
                              agreementNumber={a.agreement_number}
                              status={a.status}
                              companyName={a.lead?.company_name || null}
                            />
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
