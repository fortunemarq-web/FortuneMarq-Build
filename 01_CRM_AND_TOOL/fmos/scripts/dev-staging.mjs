/**
 * Run `next dev` wired to the STAGING database for safe MANUAL testing.
 *
 * Loads .env.staging into the environment, forces MARKETING_PREVIEW_LOCAL=0 so
 * localhost serves the FMOS APP (not the marketing site), and HARD-REFUSES to
 * run against the production project ref. Click through the app using
 * FMOS_MANUAL_TESTING_GUIDE.md without ever touching prod or messaging a customer.
 *
 * Usage:  npm run dev:staging      (reads .env.staging)
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.staging");
const PROD_REF = "cnwooodktqwvpzkucskm";

if (!existsSync(ENV_PATH)) {
  console.error("[dev:staging] .env.staging not found. Copy .env.staging.example → .env.staging first.");
  process.exit(1);
}

// Pre-set staging vars in process.env BEFORE Next starts. Next's loadEnvConfig
// will NOT override keys already present, so these win over .env.local.
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

if ((process.env.NEXT_PUBLIC_SUPABASE_URL || "").includes(PROD_REF)) {
  console.error(`[dev:staging] REFUSING: .env.staging points at PRODUCTION (${PROD_REF}). Staging only.`);
  process.exit(1);
}

// Force the app (not the marketing site) onto localhost, regardless of .env.local.
process.env.MARKETING_PREVIEW_LOCAL = "0";

console.log(`[dev:staging] DB → ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log("[dev:staging] MARKETING_PREVIEW_LOCAL=0 (serving the FMOS app on localhost)");

const child = spawn("next", ["dev", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
