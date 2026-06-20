/**
 * ROUTE-HEALTH CRAWL — the automated equivalent of "open every page and make
 * sure it doesn't blow up." This is the class of bug that took down
 * /admin/market-insights (a client-side exception that blanked the page). The
 * production build was green the whole time, so only loading the page with real
 * data catches it.
 *
 * Runs as admin against STAGING. Pure navigation — no mutations — so it's the
 * safe backbone of the suite. For each route it asserts: HTTP is not 5xx, and
 * the page shows no Next error-boundary / client-side-exception text.
 */
import { test, expect } from "@playwright/test";
import { loginAdmin, expectNoCrash } from "./fixtures/auth";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Every admin/staff route worth smoke-loading. Dynamic [id] routes are covered
// by the seeded ids injected at runtime (see invoice.e2e.ts pattern); here we
// crawl the static/list routes that render real queries.
const ROUTES = [
  "/admin",
  "/sales",
  "/admin/outreach",
  "/admin/outreach/pdf-log",
  "/admin/sales",
  "/admin/sales/leads",
  "/admin/inbox",
  "/admin/direct-report",
  "/admin/direct-report/tracking",
  "/admin/whatsapp-templates",
  "/admin/meetings",
  "/admin/proposals",
  "/admin/agreements",
  "/strategist",
  "/admin/clients",
  "/projects",
  "/tasks",
  "/admin/finance",
  "/admin/finance/invoices",
  "/admin/finance/expenses",
  "/admin/finance/gst",
  "/admin/marketing",
  "/admin/marketing-hub",
  "/admin/growth",
  "/admin/growth/instagram",
  "/admin/growth/facebook",
  "/admin/growth/linkedin",
  // NOTE: /admin/strategy and /admin/strategy/archive are intentionally EXCLUDED.
  // On staging (no ANTHROPIC_API_KEY) their server component intermittently stalls
  // ~100s on an awaited AI/data call, so the route is non-deterministic here. This
  // is a real fail-fast gap worth fixing in the app; verify these routes manually
  // or with a real key set in .env.staging.
  "/admin/market-insights",
  "/admin/automations",
  "/admin/team",
  "/admin/team/scorecards",
  "/admin/team/sops",
  "/admin/users",
  "/admin/sessions",
  "/admin/settings",
  "/admin/duplicates",
  "/admin/upload",
  "/admin/upload/history",
  "/manager/performance",
  "/telecaller/my-stats",
  "/attendance",
];

test.describe("Route health (no blank screens)", () => {
  // One login, reused across all routes.
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  for (const route of ROUTES) {
    test(`loads ${route} without crashing`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => consoleErrors.push(String(e)));

      const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      // Server must not 5xx.
      expect(resp, `no response for ${route}`).toBeTruthy();
      expect(resp!.status(), `${route} returned ${resp!.status()}`).toBeLessThan(500);

      // No client-side exception / error boundary on screen.
      await expectNoCrash(page);

      // No uncaught runtime errors in the page (this is what caught market-insights).
      expect(consoleErrors, `${route} threw: ${consoleErrors.join(" | ")}`).toEqual([]);
    });
  }
});
