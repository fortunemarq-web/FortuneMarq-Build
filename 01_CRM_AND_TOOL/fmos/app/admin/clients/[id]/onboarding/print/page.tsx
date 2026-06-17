import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { fetchClientById } from "@/app/admin/clients/actions";

export const dynamic = "force-dynamic";

const SERVICE_LABEL: Record<string, string> = {
  GENERAL: "Client Basics",
  WEBSITE: "Website Building",
  GMB: "GMB Optimization",
  SEO: "SEO",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  WHATSAPP_MARKETING: "WhatsApp Marketing",
  AI_AUTOMATIONS: "AI Automations",
  CUSTOM: "Custom",
};

const ASSET_STATUS_LABEL: Record<string, string> = {
  NOT_COLLECTED: "Not Collected",
  REQUESTED: "Requested",
  RECEIVED: "Received",
  STORED: "Stored",
};

export default async function OnboardingPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  const [client, { data: tasks }, { data: assets }] = await Promise.all([
    fetchClientById(id),
    supabase.from("client_onboarding_tasks").select("*").eq("client_id", id).order("service_id"),
    supabase.from("client_asset_vault").select("*").eq("client_id", id).order("service_id"),
  ]);

  if (!client) notFound();

  const allTasks = (tasks ?? []) as any[];
  const allAssets = (assets ?? []) as any[];
  const serviceIds = [...new Set([...allTasks.map((t: any) => t.service_id), ...allAssets.map((a: any) => a.service_id)])];

  const doneTasks = allTasks.filter((t: any) => t.status === "DONE").length;
  const printDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <html>
      <head>
        <title>Onboarding — {client.business_name}</title>
        <style>{`
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #1e293b; background: white; padding: 32px; }
          .print-btn { position: fixed; top: 16px; right: 16px; background: #1e293b; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
          @media print { .print-btn { display: none; } }
          .header { border-bottom: 2px solid #42CA80; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; font-weight: 700; }
          .header p { color: #64748b; font-size: 12px; margin-top: 4px; }
          .progress { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
          .progress-bar-wrap { flex: 1; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
          .progress-bar-fill { height: 100%; background: #42CA80; border-radius: 999px; }
          .progress-label { font-size: 12px; font-weight: 600; color: #475569; white-space: nowrap; }
          .section { margin-bottom: 20px; break-inside: avoid; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px 6px 0 0; padding: 8px 12px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden; }
          th { background: #f8fafc; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; padding: 6px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          td { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          .status-done { color: #059669; font-weight: 600; }
          .status-pending { color: #64748b; }
          .status-inprogress { color: #2563eb; font-weight: 600; }
          .status-blocked { color: #dc2626; font-weight: 600; }
          .req-badge { display: inline-block; font-size: 9px; font-weight: 700; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 1px 5px; margin-left: 4px; }
          .asset-stored { color: #059669; font-weight: 600; }
          .asset-pending { color: #d97706; }
          .subtable-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; padding: 8px 12px 4px; border-top: 1px solid #f1f5f9; background: white; }
        `}</style>
      </head>
      <body>
        <button className="print-btn" id="print-btn">Print / Save PDF</button>
        <script dangerouslySetInnerHTML={{ __html: "document.getElementById('print-btn').addEventListener('click',function(){window.print()});" }} />

        <div className="header">
          <h1>{client.business_name} — Onboarding Checklist</h1>
          <p>Generated {printDate} &nbsp;·&nbsp; {client.city} &nbsp;·&nbsp; {Array.isArray(client.services_active) ? client.services_active.join(", ") : (client.services ?? "")}</p>
        </div>

        <div className="progress">
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: allTasks.length > 0 ? `${Math.round((doneTasks / allTasks.length) * 100)}%` : "0%" }} />
          </div>
          <span className="progress-label">{doneTasks} / {allTasks.length} tasks done</span>
        </div>

        {serviceIds.map(svcId => {
          const svcTasks = allTasks.filter((t: any) => t.service_id === svcId);
          const svcAssets = allAssets.filter((a: any) => a.service_id === svcId);
          return (
            <div key={svcId} className="section">
              <div className="section-title">{SERVICE_LABEL[svcId] ?? svcId}</div>
              <table>
                {svcTasks.length > 0 && (
                  <>
                    <thead>
                      <tr>
                        <th style={{ width: "42%" }}>Task</th>
                        <th style={{ width: "14%" }}>Owner</th>
                        <th style={{ width: "14%" }}>Due</th>
                        <th style={{ width: "14%" }}>Status</th>
                        <th style={{ width: "16%" }}>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {svcTasks.map((t: any) => (
                        <tr key={t.id}>
                          <td>{t.task}{t.notes ? <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{t.notes}</span> : null}</td>
                          <td style={{ color: "#475569" }}>{t.owner}</td>
                          <td style={{ color: "#475569" }}>{t.due_by ?? "—"}</td>
                          <td className={
                            t.status === "DONE" ? "status-done" :
                            t.status === "IN_PROGRESS" ? "status-inprogress" :
                            t.status === "BLOCKED" ? "status-blocked" : "status-pending"
                          }>{t.status === "IN_PROGRESS" ? "In Progress" : t.status.charAt(0) + t.status.slice(1).toLowerCase()}</td>
                          <td style={{ color: "#94a3b8", fontSize: "11px" }}>{t.completed_at ? new Date(t.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
                {svcAssets.length > 0 && (
                  <>
                    {svcTasks.length > 0 && (
                      <tbody><tr><td colSpan={5} className="subtable-label">Assets to Collect</td></tr></tbody>
                    )}
                    <thead>
                      <tr>
                        <th colSpan={2} style={{ width: "56%" }}>Asset</th>
                        <th style={{ width: "14%" }}>Required</th>
                        <th colSpan={2} style={{ width: "30%" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {svcAssets.map((a: any) => (
                        <tr key={a.id}>
                          <td colSpan={2}>{a.asset_name}{a.notes ? <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{a.notes}</span> : null}</td>
                          <td>{a.required ? <span className="req-badge">Required</span> : <span style={{ color: "#94a3b8" }}>Optional</span>}</td>
                          <td colSpan={2} className={a.status === "STORED" ? "asset-stored" : "asset-pending"}>
                            {ASSET_STATUS_LABEL[a.status] ?? a.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          );
        })}
      </body>
    </html>
  );
}
