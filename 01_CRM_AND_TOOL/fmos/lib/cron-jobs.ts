// 6.8 — registry of the scheduled cron jobs the health check watches.
// Keys must match the job names passed to recordRun() inside each cron route,
// and the endpoints pinged by .github/workflows/cron.yml.

export interface CronJob {
  key: string;
  label: string;
  everyMins: number; // expected cadence
  batch: "15min" | "daily";
}

export const CRON_JOBS: CronJob[] = [
  { key: "sla", label: "SLA breach check", everyMins: 15, batch: "15min" },
  { key: "followups", label: "Due follow-ups", everyMins: 15, batch: "15min" },
  { key: "scheduled-messages", label: "Scheduled messages", everyMins: 15, batch: "15min" },
  { key: "whatsapp-quality", label: "WhatsApp quality / tier", everyMins: 15, batch: "15min" },
  { key: "daily-digest", label: "Daily digest", everyMins: 1440, batch: "daily" },
  { key: "admin-alerts", label: "Admin alerts", everyMins: 1440, batch: "daily" },
  { key: "session-timeout", label: "Session timeout cleanup", everyMins: 1440, batch: "daily" },
  { key: "invoice-reminders", label: "Invoice reminders", everyMins: 1440, batch: "daily" },
  { key: "backup-export", label: "Daily data export", everyMins: 1440, batch: "daily" },
  { key: "reactivation", label: "Lead reactivation drip", everyMins: 1440, batch: "daily" },
  { key: "review-requests", label: "Review + referral flywheel", everyMins: 1440, batch: "daily" },
];

/** A job is "stale" if it hasn't checked in within ~2.5 cycles (+ grace). */
export function staleAfterMins(job: CronJob): number {
  return Math.round(job.everyMins * 2.5) + (job.batch === "daily" ? 240 : 20);
}
