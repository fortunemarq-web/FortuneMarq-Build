import type { WaAudience } from "./recipients";
import { fmtINR } from "@/lib/reports/dailyReport";

const IST = "Asia/Kolkata";

/**
 * Format a raw snapshot value per an optional token modifier (the `:mod` in
 * `{field:mod}`). All dates render in IST. Fail-soft: a null/undefined value →
 * "", an invalid date / non-numeric amount / UNRECOGNIZED modifier → the raw
 * value (never empty). No modifier → raw String(value) (backward compatible).
 */
function applyModifier(raw: any, mod?: string): string {
  if (raw === undefined || raw === null) return "";
  if (!mod) return String(raw);
  switch (mod) {
    case "inr": {
      let n: number;
      if (typeof raw === "number") {
        n = raw;
      } else {
        const stripped = String(raw).replace(/[^0-9.-]/g, "");
        n = stripped === "" ? NaN : Number(stripped); // no digits → non-numeric → raw fallback
      }
      return Number.isFinite(n) ? fmtINR(n) : String(raw);
    }
    case "date":
    case "datetime":
    case "time": {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      if (mod === "date") {
        return d.toLocaleDateString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });
      }
      if (mod === "time") {
        return d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
      }
      return d.toLocaleString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
    }
    default:
      return String(raw); // unrecognized modifier → raw value
  }
}

/**
 * Template resolution + Meta Graph API parameter building for the `send_whatsapp`
 * automation action. SERVER-safe (pure functions, no imports with side effects).
 *
 * A rule's action.value is a WaTemplateConfig describing WHICH approved template to
 * send and HOW to fill its {{1}},{{2}}… body params from the entity snapshot.
 */

export interface WaTemplateConfig {
  /** Who receives it. Drives recipient resolution in recipients.ts. */
  audience: WaAudience;
  /** Flat approved template name (e.g. "meeting_confirmation"). */
  template?: string;
  /**
   * Lead-type aware selection (e.g. the market-research report). Picks a template
   * by the lead's A/B/C/D script type. Falls back to C, then to `template`.
   */
  leadTypeTemplates?: Partial<Record<"A" | "B" | "C" | "D", string>>;
  /** Template language code (default "en"). */
  lang?: string;
  /**
   * Ordered body parameters ({{1}},{{2}}…). Each entry is a token string where
   * {field} is replaced from the snapshot, e.g. "{company_name}", "Invoice {invoice_no}".
   * Plain text without braces is sent literally.
   */
  params?: string[];
  /**
   * Convenience for the generic internal templates (admin_alert / staff_alert):
   * maps to body params [headline, detail, link?]. Ignored if `params` is set.
   * Tokens ({field}) are filled from the snapshot.
   */
  headline?: string;
  detail?: string;
  link?: string;
}

/**
 * Derive a lead's A/B/C/D script type from its online-presence fields.
 * Mirrors getLeadScriptType / getScriptType (lib/data/scripts):
 *   low-volume → D · serp_ranked → A · has_website (not ranked) → B · else C.
 */
export function leadScriptType(snapshot: any): "A" | "B" | "C" | "D" {
  if (snapshot?.is_low_volume === true) return "D";
  if (snapshot?.serp_ranked === true) return "A";
  if (snapshot?.has_website === true) return "B";
  return "C";
}

/** Resolve the concrete template name from config + snapshot. */
export function resolveTemplate(cfg: WaTemplateConfig, snapshot: any): string | null {
  if (cfg.leadTypeTemplates) {
    const t = leadScriptType(snapshot);
    return cfg.leadTypeTemplates[t] || cfg.leadTypeTemplates.C || cfg.template || null;
  }
  return cfg.template || null;
}

/**
 * Replace {field} / {field:mod} tokens in a string from the snapshot.
 * Unknown tokens → "". Modifiers (date/datetime/time/inr) format the value;
 * see applyModifier.
 */
function fill(tmpl: string, snapshot: any): string {
  return String(tmpl || "").replace(/\{([\w.]+)(?::(\w+))?\}/g, (_m, key, mod) =>
    applyModifier(snapshot?.[key], mod)
  );
}

/**
 * Build the Graph API `components` array (a single body component with text params)
 * from the config + snapshot. Returns [] when the template takes no params.
 */
export function buildComponents(cfg: WaTemplateConfig, snapshot: any): any[] {
  let values: string[];
  if (cfg.params && cfg.params.length) {
    values = cfg.params.map((p) => fill(p, snapshot));
  } else if (cfg.headline || cfg.detail || cfg.link) {
    values = [fill(cfg.headline || "", snapshot), fill(cfg.detail || "", snapshot)];
    if (cfg.link) values.push(fill(cfg.link, snapshot));
  } else {
    values = [];
  }
  if (values.length === 0) return [];
  return [
    {
      type: "body",
      parameters: values.map((text) => ({ type: "text", text: text.slice(0, 1000) })),
    },
  ];
}
