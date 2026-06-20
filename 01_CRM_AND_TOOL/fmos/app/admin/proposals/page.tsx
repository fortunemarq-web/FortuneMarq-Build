import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { FileText, ArrowRight, Clock, Users } from "lucide-react";
import ProposalRowActions from "@/components/proposals/proposal-row-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

// Every proposal status maps to one of the five tones — no per-status colours.
const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  sent: "info",
  confirmed: "brand",
  rejected: "danger",
};

export default async function ProposalsListPage() {
  const supabase = await createServerClientWithCookies();

  const [{ data: proposals, error }, { data: proposalLeads }, { data: clients }] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, proposal_number, status, total_setup, total_monthly, monthly_value, onetime_value, created_at, sent_at, services, lead:leads(id, company_name, city, industry)")
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, company_name, city, industry, phone, meeting_notes, follow_up_date")
      .eq("outreach_stage", "proposal_sent")
      .order("follow_up_date", { ascending: false }),
    supabase
      .from("clients")
      .select("id, business_name"),
  ]);

  // Map business_name → client id for confirmed proposal linking
  const clientMap = Object.fromEntries((clients || []).map((c: any) => [c.business_name?.toLowerCase(), c.id]));

  // Filter out leads that already have a proposal
  const { data: existingProposalLeadIds } = await supabase
    .from("proposals")
    .select("lead_id");
  const takenIds = new Set((existingProposalLeadIds || []).map((p: any) => p.lead_id));
  const leadsNeedingProposal = (proposalLeads || []).filter((l: any) => !takenIds.has(l.id));

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  const formatINR = (n: number | null) => n ? `₹${n.toLocaleString("en-IN")}` : "—";
  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Proposals" subtitle={`${(proposals || []).length} total`} />

        {/* Leads ready for proposal */}
        {leadsNeedingProposal.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-warn" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting Proposal ({leadsNeedingProposal.length})</h2>
            </div>
            <div className="space-y-2">
              {leadsNeedingProposal.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between gap-4 rounded-lg border border-warn-line bg-warn-soft px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{lead.company_name}</p>
                    <p className="text-xs text-slate-500">{lead.industry}{lead.city ? ` · ${lead.city}` : ""}{lead.phone ? ` · ${lead.phone}` : ""}</p>
                    {lead.meeting_notes && (
                      <p className="mt-1 max-w-md truncate text-xs italic text-warn">{lead.meeting_notes}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/leads/${lead.id}/proposal/new`}
                    className={buttonVariants({ variant: "primary", size: "sm", className: "shrink-0" })}
                  >
                    Create Proposal <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="overflow-hidden">
          {(!proposals || proposals.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No proposals yet.</p>
              <p className="mt-1 text-xs">Create one from a Lead Profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    {["Proposal No", "Lead / Client", "Services", "Setup", "Monthly", "Status", "Created", "Sent", ""].map(h => (
                      <TH key={h}>{h}</TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {(proposals || []).map((p: any) => {
                    const clientId = p.status === "confirmed"
                      ? clientMap[(p.lead?.company_name || "").toLowerCase()]
                      : null;
                    return (
                    <TR key={p.id}>
                      <TD>
                        <span className="text-xs font-semibold tabular-nums text-slate-700">{p.proposal_number || "—"}</span>
                      </TD>
                      <TD>
                        <Link href={`/admin/leads/${p.lead?.id}`} className="font-semibold text-slate-900 transition-colors hover:text-brand-deep">
                          {p.lead?.company_name || "—"}
                        </Link>
                        <p className="text-[11px] text-slate-400">{p.lead?.city}</p>
                      </TD>
                      <TD>
                        <p className="text-xs text-slate-600">
                          {Array.isArray(p.services) ? p.services.map((s: any) => s.label).join(", ") : "—"}
                        </p>
                      </TD>
                      <TD className="text-sm font-semibold tabular-nums text-slate-800">{formatINR(p.total_setup ?? p.onetime_value ?? 0)}</TD>
                      <TD className="text-sm font-semibold tabular-nums text-brand-deep">{formatINR(p.total_monthly ?? p.monthly_value ?? 0)}/mo</TD>
                      <TD>
                        <Badge tone={STATUS_TONE[p.status] || "neutral"} size="sm" className="capitalize">
                          {p.status || "draft"}
                        </Badge>
                      </TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">{formatDate(p.created_at)}</TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">{formatDate(p.sent_at)}</TD>
                      <TD>
                        <div className="flex items-center justify-end gap-2">
                          {clientId ? (
                            <Link href={`/admin/clients/${clientId}`} className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-brand-deep hover:underline">
                              <Users className="h-3 w-3" /> View Client
                            </Link>
                          ) : p.status === "sent" && p.lead?.id ? (
                            <Link href={`/admin/leads/${p.lead.id}`} className="whitespace-nowrap text-[11px] font-semibold text-info hover:underline">
                              Confirm →
                            </Link>
                          ) : null}
                          <ProposalRowActions
                            proposalId={p.id}
                            proposalNumber={p.proposal_number}
                            status={p.status}
                            leadId={p.lead?.id || null}
                            companyName={p.lead?.company_name || null}
                            totalAmount={p.total_setup ?? p.onetime_value ?? 0}
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
