/**
 * Login helpers for E2E specs. Reuses the real /login form (same selectors the
 * existing smoke specs use). Credentials come from .env.staging so no secrets
 * are committed.
 */
import { type Page, expect } from "@playwright/test";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "e2e-admin@fmos.test",
  password: process.env.E2E_ADMIN_PASSWORD || "E2e!StagingPass1",
};
export const TELECALLER = {
  email: process.env.E2E_TELECALLER_EMAIL || "e2e-caller@fmos.test",
  password: process.env.E2E_TELECALLER_PASSWORD || "E2e!StagingPass1",
};

export async function login(page: Page, who: { email: string; password: string }): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("you@company.com").fill(who.email);
  await page.getByPlaceholder("Enter your password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Land anywhere authenticated (admin → /admin, telecaller → /sales).
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
}

export async function loginAdmin(page: Page): Promise<void> {
  await login(page, ADMIN);
}
export async function loginTelecaller(page: Page): Promise<void> {
  await login(page, TELECALLER);
}

/** Assert the page is not showing Next's client-exception / error boundary. */
export async function expectNoCrash(page: Page): Promise<void> {
  const body = page.locator("body");
  await expect(body).toBeVisible();
  await expect(body).not.toContainText(/Application error|client-side exception|something went wrong/i);
}
