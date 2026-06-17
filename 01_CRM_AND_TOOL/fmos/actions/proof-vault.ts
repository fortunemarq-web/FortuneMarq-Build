"use server";

/**
 * 4.6 — Results → Proof Vault.
 *
 * Pushes a REAL, CONSENTED client result into the Proof Vault
 * (05_FORTUNEMARQ_ONLINE_PRESENCE/Proof_Vault), one subfolder per case study.
 *
 * NEVER automatic. The caller must pass consented:true plus who consented and a
 * consent note — the action hard-rejects otherwise. The Proof Vault README is
 * explicit: "REAL, consented client results + case studies only — never fabricated."
 *
 * Writes two files in the case-study folder:
 *   case_study.md — the write-up, metrics, and source links (GA/Ads/Meta)
 *   consent.md    — who consented, when, and the note (audit trail)
 *
 * Filesystem write: resolves the vault relative to the repo root. Works when the
 * app runs from the repo (local / self-hosted). On a read-only serverless FS the
 * write fails and we return a clear error rather than silently dropping it.
 */

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const VAULT_REL = "../../05_FORTUNEMARQ_ONLINE_PRESENCE/Proof_Vault";

export interface CaseStudyMetric {
  label: string;   // e.g. "Google Maps calls"
  before: string;  // e.g. "12/mo"
  after: string;   // e.g. "47/mo"
}

export interface MarkCaseStudyInput {
  clientId: string;
  title: string;
  summary: string;
  consented: boolean;       // MUST be true
  consentBy: string;        // who at the client gave consent
  consentNote: string;      // how/when consent was captured
  metrics?: CaseStudyMetric[];
  sourceLinks?: string[];   // GA / Google Ads / Meta screenshots or dashboards
}

export interface MarkCaseStudyResult {
  ok: boolean;
  folder?: string;
  error?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "case-study";
}

export async function markAsCaseStudy(input: MarkCaseStudyInput): Promise<MarkCaseStudyResult> {
  // ── Consent gate — refuse anything not explicitly consented ──
  if (!input.consented) {
    return { ok: false, error: "Consent is required. A case study cannot be created without explicit client consent." };
  }
  if (!input.consentBy?.trim() || !input.consentNote?.trim()) {
    return { ok: false, error: "Record who consented and a consent note before publishing to the Proof Vault." };
  }
  if (!input.title?.trim() || !input.summary?.trim()) {
    return { ok: false, error: "A title and a result summary are required." };
  }

  const supabase = (await createServerClientWithCookies()) as any;

  // Resolve the client for the business name + an audit trail.
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, niche, city")
    .eq("id", input.clientId)
    .maybeSingle();
  const businessName = client?.business_name ?? "Client";

  const stamp = new Date();
  const dateStr = stamp.toISOString().slice(0, 10);
  const folderName = `${dateStr}-${slugify(businessName)}-${slugify(input.title)}`;

  const vaultRoot = resolve(process.cwd(), VAULT_REL);
  const caseDir = join(vaultRoot, folderName);

  // ── Build the write-up ──
  const metricsBlock = (input.metrics ?? []).length
    ? "\n## Results\n\n| Metric | Before | After |\n|---|---|---|\n" +
      input.metrics!.map((m) => `| ${esc(m.label)} | ${esc(m.before)} | ${esc(m.after)} |`).join("\n") + "\n"
    : "";

  const linksBlock = (input.sourceLinks ?? []).filter(Boolean).length
    ? "\n## Source Proof\n\n" + input.sourceLinks!.filter(Boolean).map((l) => `- ${esc(l)}`).join("\n") + "\n"
    : "";

  const caseStudyMd =
    `# ${esc(input.title)}\n\n` +
    `**Client:** ${esc(businessName)}` +
    `${client?.niche ? ` · ${esc(client.niche)}` : ""}${client?.city ? ` · ${esc(client.city)}` : ""}\n\n` +
    `**Published:** ${dateStr}\n\n` +
    `## Summary\n\n${esc(input.summary)}\n` +
    metricsBlock +
    linksBlock +
    `\n---\n_Consented case study. See consent.md for the consent record._\n`;

  const consentMd =
    `# Consent Record\n\n` +
    `**Case study:** ${esc(input.title)}\n\n` +
    `**Client:** ${esc(businessName)}\n\n` +
    `**Consent given by:** ${esc(input.consentBy)}\n\n` +
    `**Recorded:** ${stamp.toISOString()}\n\n` +
    `**Note:**\n\n${esc(input.consentNote)}\n`;

  // ── Write to the vault ──
  try {
    await mkdir(caseDir, { recursive: true });
    await writeFile(join(caseDir, "case_study.md"), caseStudyMd, "utf8");
    await writeFile(join(caseDir, "consent.md"), consentMd, "utf8");
  } catch (e: any) {
    return {
      ok: false,
      error: `Couldn't write to the Proof Vault (${e?.message ?? "fs error"}). This runs against the local repo filesystem.`,
    };
  }

  return { ok: true, folder: folderName };
}

/** Minimal markdown-cell / injection guard for pasted text. */
function esc(s: string): string {
  return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}
